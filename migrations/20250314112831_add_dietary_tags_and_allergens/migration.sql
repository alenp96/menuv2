-- CreateTable
CREATE TABLE "DietaryTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "DietaryTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Allergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DietaryTagToMenuItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AllergenToMenuItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DietaryTag_name_key" ON "DietaryTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Allergen_name_key" ON "Allergen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_DietaryTagToMenuItem_AB_unique" ON "_DietaryTagToMenuItem"("A", "B");

-- CreateIndex
CREATE INDEX "_DietaryTagToMenuItem_B_index" ON "_DietaryTagToMenuItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AllergenToMenuItem_AB_unique" ON "_AllergenToMenuItem"("A", "B");

-- CreateIndex
CREATE INDEX "_AllergenToMenuItem_B_index" ON "_AllergenToMenuItem"("B");

-- AddForeignKey
ALTER TABLE "_DietaryTagToMenuItem" ADD CONSTRAINT "_DietaryTagToMenuItem_A_fkey" FOREIGN KEY ("A") REFERENCES "DietaryTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DietaryTagToMenuItem" ADD CONSTRAINT "_DietaryTagToMenuItem_B_fkey" FOREIGN KEY ("B") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllergenToMenuItem" ADD CONSTRAINT "_AllergenToMenuItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllergenToMenuItem" ADD CONSTRAINT "_AllergenToMenuItem_B_fkey" FOREIGN KEY ("B") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
