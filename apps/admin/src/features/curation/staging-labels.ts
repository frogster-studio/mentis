// One home for the glossary's staging words, so no column ever invents a synonym for a flag.
export function publishedLabel(published: boolean): string {
  return published ? "Published" : "Unpublished";
}

export function readyLabel(readyToBePublished: boolean): string {
  return readyToBePublished ? "Ready to be published" : "Not ready to be published";
}

export function visibleLabel(visible: boolean): string {
  return visible ? "Visible" : "Hidden";
}
