<?php

namespace App\Http\Controllers;

use App\Models\Carrusel;
use Illuminate\Http\Request;
use App\Http\Requests\StoreSlideRequest;
use App\Http\Requests\UpdateSlideRequest;
use App\Http\Resources\CarouselSlideResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class CarruselController extends Controller
{
    // Público (slides activos y vigentes)
    public function publicIndex(Request $request)
    {
        $now = now();

        $slides = Carrusel::query()
            ->where('is_active', true)
            ->where(function($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->orderBy('position')->orderBy('id')
            ->get();

        return CarouselSlideResource::collection($slides);
    }

    // Admin (paginado + filtros)
    public function index(Request $request)
    {
        $q = Carrusel::query();

        if ($request->filled('search')) {
            $s = $request->string('search');
            $q->where(function($qq) use ($s) {
                $qq->where('title','like',"%{$s}%")
                   ->orWhere('caption','like',"%{$s}%");
            });
        }

        if ($request->has('active') && $request->active !== '') {
            $active = filter_var($request->active, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
            if ($active !== null) $q->where('is_active', $active);
        }

        $q->orderBy('position')->orderBy('id');

        return CarouselSlideResource::collection($q->paginate(15));
    }

    public function store(StoreSlideRequest $request)
    {
        $data = $request->validated();

        $path = $request->file('image')->store('carousel', 'public');
        $mobilePath = $request->hasFile('mobile_image')
            ? $request->file('mobile_image')->store('carousel', 'public')
            : null;

        $slide = Carrusel::create([
            ...$data,
            'image_path'        => $path,
            'mobile_image_path' => $mobilePath,
            'position'          => $data['position'] ?? (Carrusel::max('position') + 1),
        ]);

        return new CarouselSlideResource($slide);
    }

    public function update(UpdateSlideRequest $request, Carrusel $slide)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($slide->image_path) Storage::disk('public')->delete($slide->image_path);
            $data['image_path'] = $request->file('image')->store('carousel','public');
        }
        if ($request->hasFile('mobile_image')) {
            if ($slide->mobile_image_path) Storage::disk('public')->delete($slide->mobile_image_path);
            $data['mobile_image_path'] = $request->file('mobile_image')->store('carousel','public');
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
            'items' => ['required','array'],
            'items.*.id' => ['required','integer','exists:carousel_slides,id'],
            'items.*.position' => ['required','integer','min:0'],
        ])['items'];

        DB::transaction(function() use ($items) {
            foreach ($items as $it) {
                Carrusel::where('id',$it['id'])->update(['position' => $it['position']]);
            }
        });

        return response()->json(['status' => 'ok']);
    }

    public function toggle(Carrusel $slide)
    {
        $slide->update(['is_active' => !$slide->is_active]);
        return new CarouselSlideResource($slide);
    }
}
