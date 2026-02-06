export function CopyrightFooter() {
  return (
    <div className="py-4 mt-8 text-center">
      <p className="text-xs text-muted-foreground/60">
        © {new Date().getFullYear()} All rights reserved H-core
      </p>
    </div>
  );
}
