import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h2>Error 404</h2>
      <p>No se ha podido encontrar el recurso solicitado</p>
      <Link href="/">Return Home</Link>
    </div>
  );
}
