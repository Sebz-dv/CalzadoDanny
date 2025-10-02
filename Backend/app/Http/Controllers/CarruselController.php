<?php

namespace App\Http\Controllers;

use App\Models\Carrusel;
use Illuminate\Http\Request;
use App\Http\Requests\StoreSlideRequest;
use App\Http\Requests\UpdateSlideRequest;
use App\Http\Resources\CarouselSlideResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CarruselController extends Controller
{
    // --- Helper: guarda respetando el nombre original (slug) y evitando colisiones ---
    protected function storeWithOriginalName(UploadedFile $file, string $dir = 'carousel', string $diskName = 'public'): string
    {
        $disk = Storage::disk($diskName);

        $original   = $file->getClientOriginalName();
        $baseName   = pathinfo($original, PATHINFO_FILENAME);
        $extension  = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin');

        $slug       = Str::slug($baseName) ?: 'archivo';
        $filename   = "{$slug}.{$extension}";
        $path       = "{$dir}/{$filename}";

        $i = 1;
        while ($disk->exists($path)) {
            $filename = "{$slug}-{$i}.{$extension}";
            $path     = "{$dir}/{$filename}";
            $i++;
        }

        $disk->putFileAs($dir, $file, $filename);

        // 🔎 LOG: dónde quedó guardado, url relativa/absoluta y existencias reales
        $relUrl = $disk->url($path);                  // ej. "/storage/carousel/mi-banner.png"
        $absUrl = str_starts_with($relUrl, 'http') ? $relUrl : url($relUrl);

        return $path;
    }

    public function index(Request $request)
    {
        $res = Carrusel::orderBy('position')->orderBy('id')->paginate(15);

        if (app()->isLocal()) {
            $first = optional($res->first());
        }

        return CarouselSlideResource::collection($res);
    }


    public function store(StoreSlideRequest $request)
    {
        $data = $request->validated();

        $path = $this->storeWithOriginalName($request->file('image'), 'carousel', 'public');
        $mobilePath = $request->hasFile('mobile_image')
            ? $this->storeWithOriginalName($request->file('mobile_image'), 'carousel', 'public')
            : null;

        $nextPos = (Carrusel::max('position') ?? 0) + 1;

        $slide = Carrusel::create([
            ...$data,
            'image_path'        => $path,
            'mobile_image_path' => $mobilePath,
            'position'          => $data['position'] ?? $nextPos,
        ]);

        return new CarouselSlideResource($slide);
    }

    public function update(UpdateSlideRequest $request, Carrusel $slide)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($slide->image_path) Storage::disk('public')->delete($slide->image_path);
            $data['image_path'] = $this->storeWithOriginalName($request->file('image'), 'carousel', 'public');
        }

        if ($request->hasFile('mobile_image')) {
            if ($slide->mobile_image_path) Storage::disk('public')->delete($slide->mobile_image_path);
            $data['mobile_image_path'] = $this->storeWithOriginalName($request->file('mobile_image'), 'carousel', 'public');
        }

        $slide->update($data);

        return new CarouselSlideResource($slide);
    }

    public function destroy(Carrusel $slide)
    {
        if ($slide->image_path) Storage::disk('public')->delete($slide->image_path);
        if ($slide->mobile_image_path) Storage::disk('public')->delete($slide->mobile_image_path);

        $slide->delete();

        return response()->noContent();
    }

    // Reordenar: [{id, position}]
    public function reorder(Request $request)
    {
        $items = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:carousel_slides,id'],
            'items.*.position' => ['required', 'integer', 'min:0'],
        ])['items'];

        DB::transaction(function () use ($items) {
            foreach ($items as $it) {
                Carrusel::where('id', $it['id'])->update(['position' => $it['position']]);
            }
        });

        return response()->json(['status' => 'ok']);
    }

    public function toggle(Carrusel $slide)
    {
        $slide->update(['is_active' => !$slide->is_active]);
        return new CarouselSlideResource($slide);
    }

    public function publicIndex(Request $request)
    {
        $now = now();

        $slides = Carrusel::query()
            ->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->orderBy('position')->orderBy('id')
            ->get();

        // Importante: devolver Resource::collection para incluir image_url, etc.
        return \App\Http\Resources\CarouselSlideResource::collection($slides);
    }
}
