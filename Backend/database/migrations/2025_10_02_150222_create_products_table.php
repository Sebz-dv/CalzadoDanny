<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('category_id')->constrained()->cascadeOnDelete();

            $table->string('name')->index();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('price_cents')->default(0); // en centavos
            $table->string('size', 32)->nullable();   // "35", "36", "M", "L", etc.
            $table->string('color', 24)->nullable();
            $table->enum('gender', ['male','female'])->index(); // hombre/mujer

            $table->string('main_image_path')->nullable();
            $table->string('main_image_alt')->nullable();

            $table->enum('status', ['draft','published','archived'])->default('published');

            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('path');                // storage path
            $table->string('alt')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
    }
};