<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $q = Category::query();

        if ($s = $request->string('search')->toString()) {
            $q->where(function ($qq) use ($s) {
                $qq->where('name', 'like', "%$s%")
                   ->orWhere('slug', 'like', "%$s%")
                   ->orWhere('subtitle', 'like', "%$s%");
            });
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        if (!is_null($request->input('is_featured'))) {
            $q->where('is_featured', $request->boolean('is_featured'));
        }

        $sortBy  = $request->get('sort_by', 'position');
        $sortDir = $request->get('sort_dir', 'asc');
        $q->orderBy($sortBy, $sortDir)->orderBy('id', 'asc');

        $perPage = (int)($request->get('per_page', 12));
        $page = $q->paginate($perPage)->appends($request->query());

        return CategoryResource::collection($page);
    }

    public function store(StoreCategoryRequest $request)
    {
        $data = $request->validated();

        // ✅ acepta SOLO estos campos (evita image_url y similares)
        $data = Arr::only($data, [
            'name','slug','subtitle','description','color',
            'position','is_featured','status','image_alt',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            if ($file->isValid()) {
                $data['image_path'] = $file->store('categories', 'public');
            }
        }

        $cat = Category::create($data);
        return new CategoryResource($cat);
    }

    public function show(Category $category)
    {
        return new CategoryResource($category);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $data = $request->validated();

        // ✅ limita llaves
        $data = Arr::only($data, [
            'name','slug','subtitle','description','color',
            'position','is_featured','status','image_alt',
        ]);

        if ($request->hasFile('image')) {
            if ($category->image_path && Storage::disk('public')->exists($category->image_path)) {
                Storage::disk('public')->delete($category->image_path);
            }
            $file = $request->file('image');
            if ($file->isValid()) {
                $data['image_path'] = $file->store('categories', 'public');
            }
        }

        // 🧹 limpiar si vino la clave "image" sin archivo (desde el front enviamos "")
        if ($request->exists('image') && !$request->hasFile('image')) {
            if ($category->image_path && Storage::disk('public')->exists($category->image_path)) {
                Storage::disk('public')->delete($category->image_path);
            }
            $data['image_path'] = null;
        }

        $category->update($data);
        return new CategoryResource($category);
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(['ok' => true]);
    }

    public function toggle(Category $category)
    {
        $category->is_featured = !$category->is_featured;
        $category->save();
        return new CategoryResource($category);
    }
}
