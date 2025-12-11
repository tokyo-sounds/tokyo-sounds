'use client';

export default function Footer() {
  return (
    <footer className="w-full bg-gray-100 py-4 flex justify-center items-center">
      <p className="text-center text-gray-500">
        &copy; {new Date().getFullYear()} Tokyo Sounds. All rights reserved.
      </p>
    </footer>
  );
}
