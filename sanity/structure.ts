import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("natOnat CMS")
    .items([
      S.listItem()
        .title("Flash sale modal")
        .child(
          S.document()
            .schemaType("flashSaleSettings")
            .documentId("flashSaleSettings")
            .title("Flash sale modal"),
        ),
      S.listItem()
        .title("Flash sale section")
        .child(
          S.document()
            .schemaType("flashSaleSectionSettings")
            .documentId("flashSaleSectionSettings")
            .title("Flash sale section"),
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
      S.documentTypeListItem("discountCode")
        .title("Discount codes")
        .child(
          S.documentTypeList("discountCode")
            .title("Discount codes")
            .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
        ),
      S.listItem()
        .title("Referral program")
        .child(
          S.document()
            .schemaType("referralProgram")
            .documentId("referralProgram")
            .title("Referral program"),
        ),
      S.documentTypeListItem("referralRecord")
        .title("Referral records")
        .child(
          S.documentTypeList("referralRecord")
            .title("Referral records")
            .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
        ),
      S.documentTypeListItem("productReview")
        .title("Product reviews")
        .child(
          S.documentTypeList("productReview")
            .title("Product reviews")
            .defaultOrdering([{ field: "submittedAt", direction: "desc" }]),
        ),
    ]);
