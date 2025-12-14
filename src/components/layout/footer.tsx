'use client';

export default function Footer() {
  return (
    <footer className="w-full bg-linear-to-t from-accent/30 to-transparent py-6 flex justify-center items-center">
      <p className="text-center text-primary-foreground text-sm md:text-base">
        &copy; {new Date().getFullYear()} Tokyo Sounds. All rights reserved.
      </p>
    </footer>
  );
}
