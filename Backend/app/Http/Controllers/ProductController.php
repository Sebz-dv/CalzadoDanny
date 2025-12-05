<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    // --- Helper: normaliza "gender" al valor que acepta el ENUM actual de la BD ---
    private function normalizeGenderForDB(?string $input): string
    {
        $raw = strtolower(trim((string) $input));

        // 1) Canonicalizamos a "male"/"female" (aceptamos alias/labels)
        $canonical = match ($raw) {
            'male', 'm', 'h', 'hombre'  => 'male',
            'female', 'f', 'mujer'      => 'female',
            default                      => 'male', // por defecto
        };

        // 2) Leemos los valores reales del ENUM en BD una sola vez (cache estático)
        static $allowed = null;
        if ($allowed === null) {
            try {
                $col = DB::select("SHOW COLUMNS FROM `products` LIKE 'gender'");
                // Type viene como: enum('male','female')
                $type = $col[0]->Type ?? '';
                if (preg_match("/^enum\\((.+)\\)$/i", $type, $m)) {
                    // extrae los valores entre comillas
                    $parts = array_map(
                        fn($s) => trim($s, " '"),
                        explode(',', $m[1])
                    );
                    $allowed = array_map('strtolower', $parts);
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo leer ENUM gender, fallback a [male,female]', ['e' => $e->getMessage()]);
            }
            if (empty($allowed) || !is_array($allowed)) {
                $allowed = ['male', 'female']; // fallback sensato
            }
            Log::info('ENUM gender permitido (detectado)', ['allowed' => $allowed]);
        }

        // 3) Si el ENUM permite 'male'/'female', usar tal cual.
        if (in_array($canonical, $allowed, true)) {
            return $canonical;
        }

        // 4) Si el ENUM es 'hombre'/'mujer', mapear.
        $mapHF = [
            'male'   => in_array('hombre', $allowed, true) ? 'hombre' : ($allowed[0] ?? 'male'),
            'female' => in_array('mujer',  $allowed, true) ? 'mujer'  : ($allowed[0] ?? 'male'),
        ];
        return $mapHF[$canonical] ?? ($allowed[0] ?? 'male');
    }

    // GET /api/products
    public function index(Request $request)
    {
        $q = Product::query()->with(['images', 'category']);

        if ($s = $request->string('search')->toString()) {
            $q->where(function ($qq) use ($s) {
                $qq->where('name', 'like', "%$s%")
                    ->orWhere('slug', 'like', "%$s%");
            });
        }

        if ($cid = $request->integer('category_id')) {
            $q->where('category_id', $cid);
        }

        if ($cslug = $request->string('category_slug')->toString()) {
            $category = Category::where('slug', $cslug)->first();
            if ($category) {
                $q->where('category_id', $category->id);
            } else {
                return ProductResource::collection(collect([]));
            }
        }

        if ($gender = $request->string('gender')->toString()) {
            // Normalizamos filtro para que funcione con el ENUM real
            $q->where('gender', $this->normalizeGenderForDB($gender));
        }

        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }

        $q->orderBy('id', 'desc');

        $perPage = (int) ($request->get('per_page', 12));
        $page = $q->paginate($perPage)->appends($request->query());

        return ProductResource::collection($page);
    }

    // GET /api/products/{product}
    public function show(Product $product)
    {
        $product->load(['images', 'category']);
        return new ProductResource($product);
    }

    public function store(StoreProductRequest $request)
    {
        try {
            Log::info('STORE products payload', [
                'except_files'   => $request->except(['main_image', 'images']),
                'has_main_image' => $request->hasFile('main_image'),
                'images_count'   => is_array($request->file('images')) ? count($request->file('images')) : 0,
            ]);

            $data = Arr::only($request->validated(), [
                'category_id',
                'name',
                'slug',
                'description',
                'size',
                'color',
                'referencia',
                'gender',
                'status',
                'main_image_alt',
                'price_cents', // 👈 NUEVO
            ]);

            // Normaliza gender
            $data['gender'] = $this->normalizeGenderForDB($data['gender'] ?? 'male');

            return DB::transaction(function () use ($request, $data) {
                if ($request->hasFile('main_image') && $request->file('main_image')->isValid()) {
                    $data['main_image_path'] = $request->file('main_image')->store('products', 'public');
                }

                $product = Product::create($data);

                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $i => $file) {
                        if (!$file->isValid()) continue;
                        $path = $file->store('products', 'public');
                        ProductImage::create([
                            'product_id' => $product->id,
                            'path'       => $path,
                            'alt'        => $request->input("images_alt.$i"),
                            'position'   => $i,
                        ]);
                    }
                }

                $product->load(['images', 'category']);
                return new ProductResource($product);
            });
        } catch (\Throwable $e) {
            Log::error('STORE products failed', [
                'msg'  => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'message' => 'No se pudo crear el producto',
                'error'   => config('app.debug') ? $e->getMessage() : 'internal',
            ], 500);
        }
    }

    // PUT/PATCH /api/products/{product}
    public function update(UpdateProductRequest $request, Product $product)
    {
        try {
            $data = Arr::only($request->validated(), [
                'category_id',
                'name',
                'slug',
                'description',
                'size',
                'color',
                'referencia',
                'gender',
                'status',
                'main_image_alt',
                'price_cents', // 👈 NUEVO
            ]);

            if (array_key_exists('gender', $data)) {
                $data['gender'] = $this->normalizeGenderForDB($data['gender']);
            }

            return DB::transaction(function () use ($request, $product, $data) {
                if ($request->hasFile('main_image')) {
                    if ($product->main_image_path && Storage::disk('public')->exists($product->main_image_path)) {
                        Storage::disk('public')->delete($product->main_image_path);
                    }
                    $data['main_image_path'] = $request->file('main_image')->store('products', 'public');
                }

                if ($request->exists('main_image') && !$request->hasFile('main_image')) {
                    if ($product->main_image_path && Storage::disk('public')->exists($product->main_image_path)) {
                        Storage::disk('public')->delete($product->main_image_path);
                    }
                    $data['main_image_path'] = null;
                }

                $product->update($data);

                if ($request->hasFile('images')) {
                    $base = (int) (($product->images()->max('position')) ?? 0) + 1;
                    foreach ($request->file('images') as $i => $file) {
                        if (!$file->isValid()) continue;
                        $path = $file->store('products', 'public');
                        ProductImage::create([
                            'product_id' => $product->id,
                            'path'       => $path,
                            'alt'        => $request->input("images_alt.$i"),
                            'position'   => $base + $i,
                        ]);
                    }
                }

                foreach ((array) $request->input('remove_image_ids', []) as $imgId) {
                    $img = $product->images()->whereKey($imgId)->first();
                    if ($img) {
                        if ($img->path && Storage::disk('public')->exists($img->path)) {
                            Storage::disk('public')->delete($img->path);
                        }
                        $img->delete();
                    }
                }

                if (is_array($request->input('images_order'))) {
                    foreach ($request->input('images_order') as $pos => $imgId) {
                        $product->images()->whereKey($imgId)->update(['position' => $pos]);
                    }
                }

                $product->load(['images', 'category']);
                return new ProductResource($product);
            });
        } catch (\Throwable $e) {
            Log::error('UPDATE products failed', [
                'msg'  => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'message' => 'No se pudo actualizar el producto',
                'error'   => config('app.debug') ? $e->getMessage() : 'internal',
            ], 500);
        }
    }


    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['ok' => true]);
    }
}
