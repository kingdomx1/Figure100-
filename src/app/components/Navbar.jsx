"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faShoppingCart } from "@fortawesome/free-solid-svg-icons";

function Navbar() {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [isShopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [categories, setCategories] = useState({
    studios: [],
    titles: [],
    scales: [],
  });

  const shopRef = useRef(null);
  const profileRef = useRef(null);

  const toggleShopDropdown = () => {
    setShopDropdownOpen(!isShopDropdownOpen);
    setProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!isProfileDropdownOpen);
    setShopDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        shopRef.current &&
        !shopRef.current.contains(event.target) &&
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShopDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load cart count
  useEffect(() => {
    const fetchCart = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/cart?userId=${session.user.email}`);
          const data = await res.json();
          const total = data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          setCartCount(total);
        } catch (error) {
          console.error("โหลดจำนวนตะกร้าไม่สำเร็จ:", error);
        }
      }
    };
    fetchCart();
  }, [session]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        console.log (data)
        setCategories(data);
      } catch (error) {
        console.error("โหลดหมวดหมู่ไม่สำเร็จ:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <header className="bg-gray-800 text-white shadow-md mt-4">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        <h1 className="text-2xl font-bold">
          <Link href="/">My Shop</Link>
        </h1>

        <nav className="flex items-center space-x-8">
          <Link href="/welcome" className="text-lg hover:underline">HOME</Link>

          <div className="relative" ref={shopRef}>
            <button
              onClick={toggleShopDropdown}
              className="text-lg hover:underline focus:outline-none"
            >
              SHOP
            </button>
            {isShopDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 bg-gray-800 text-white shadow-lg rounded-lg w-[300px] z-50 overflow-hidden">
                
                {/* SHOP BY Studio */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">SHOP BY Studio</h3>
                  <ul className="space-y-1">
                    {Array.isArray(categories.studios) &&
                      categories.studios.map((studio) => (
                        <li key={studio}>
                          <Link
                            href={`/welcome?studio=${encodeURIComponent(studio)}`}
                            className="hover:underline capitalize"
                          >
                            {studio}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>

                <hr className="border-gray-600" />

                {/* SHOP BY Title */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">SHOP BY Title</h3>
                  <ul className="space-y-1">
                    {Array.isArray(categories.titles) &&
                      categories.titles.map((title) => (
                        <li key={title}>
                          <Link
                            href={`/welcome?title=${encodeURIComponent(title)}`}
                            className="hover:underline capitalize"
                          >
                            {title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>

                <hr className="border-gray-600" />

                {/* SHOP BY Scale */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">SHOP BY Scale</h3>
                  <ul className="space-y-1">
                    {Array.isArray(categories.scales) &&
                      categories.scales.map((scale) => (
                        <li key={scale}>
                          <Link
                            href={`/welcome?scale=${encodeURIComponent(scale)}`}
                            className="hover:underline capitalize"
                          >
                            {scale}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Profile & Cart */}
        <div className="flex items-center space-x-4">
          <div className="relative" ref={profileRef}>
            <button
              onClick={toggleProfileDropdown}
              className="hover:underline focus:outline-none"
            >
              <FontAwesomeIcon icon={faUser} />
            </button>
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 bg-gray-800 text-white shadow-lg rounded-lg w-[250px] z-50">
                {session?.user ? (
                  <div className="p-4 space-y-2">
                    <p className="font-bold">{session.user.name}</p>
                    <p className="text-sm text-gray-300">{session.user.email}</p>

                    <Link href="/orders/history">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded">
                        ดูประวัติการสั่งซื้อ
                      </button>
                    </Link>

                    <Link href="/profile/edit">
                      <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2 rounded">
                        แก้ไขข้อมูลผู้ใช้งาน
                      </button>
                    </Link>

                    <button
                      onClick={() => signOut()}
                      className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="p-4">
                    <Link href="/login" className="hover:underline block text-center">
                      Login
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <Link href="/cart" className="relative hover:underline">
            <FontAwesomeIcon icon={faShoppingCart} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
