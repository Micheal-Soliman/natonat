import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("natOnat CMS")
    .items([
      S.documentTypeListItem("product")
        .title("Products")
        .child(
          S.documentTypeList("product")
            .title("Products")
            .defaultOrdering([{ field: "sortOrder", direction: "asc" }]),
        ),
    ]);
