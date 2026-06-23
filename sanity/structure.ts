import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("natOnat CMS")
    .items([
      S.listItem()
        .title("Flash sale")
        .child(
          S.document()
            .schemaType("flashSaleSettings")
            .documentId("flashSaleSettings")
            .title("Flash sale"),
        ),
      S.listItem()
        .title("Size guide")
        .child(
          S.document()
            .schemaType("sizeGuideSettings")
            .documentId("sizeGuideSettings")
            .title("Size guide"),
        ),
      S.documentTypeListItem("product")
        .title("Products")
        .child(
          S.documentTypeList("product")
            .title("Products")
            .defaultOrdering([{ field: "sortOrder", direction: "asc" }]),
        ),
    ]);
