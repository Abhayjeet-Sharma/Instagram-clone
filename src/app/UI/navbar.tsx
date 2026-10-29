import Link from "next/link";
export default function Navbar(){
    return (
        <nav className="h-16 flex justify-around fixed left-0 right-0 bottom-0 border border-gray-200 items-center bg-white">
            <Link href="/">Home</Link>
            <Link href="/explore">Search</Link>
            <Link href="/reels">Reels</Link>
            <Link href="/create">Create</Link>
            <Link href="/profile">Profile</Link>
        </nav>
    );
}