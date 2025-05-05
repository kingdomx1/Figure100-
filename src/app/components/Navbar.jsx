"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faShoppingCart } from '@fortawesome/free-solid-svg-icons'

function Navbar({ session }) {
  const [isShopDropdownOpen, setShopDropdownOpen] = useState(false)
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const shopRef = useRef(null)
  const profileRef = useRef(null)

  const toggleShopDropdown = () => {
    setShopDropdownOpen(!isShopDropdownOpen)
    setProfileDropdownOpen(false)
  }

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!isProfileDropdownOpen)
    setShopDropdownOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        shopRef.current && !shopRef.current.contains(event.target) &&
        profileRef.current && !profileRef.current.contains(event.target)
      ) {
        setShopDropdownOpen(false)
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <header className="bg-black text-white shadow-md mt-4">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        {/* Logo */}
        <h1 className="text-2xl font-bold">
          <Link href="/">My Shop</Link>
        </h1>

        {/* Navbar Links */}
        <nav className="flex items-center space-x-8">
          <Link href="/" className="text-lg hover:underline">HOME</Link>

          {/* SHOP Dropdown */}
          <div className="relative" ref={shopRef}>
            <button
              onClick={toggleShopDropdown}
              className="text-lg hover:underline focus:outline-none"
            >
              SHOP
            </button>
            {isShopDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 bg-gray-800 text-white shadow-lg rounded-lg w-[300px] z-50">
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">SHOP BY Studio</h3>
                  <ul className="space-y-1">
                    <li><Link href="/shop/studio/tsume" className="hover:underline">Tsume Studio</Link></li>
                    <li><Link href="/shop/studio/xm" className="hover:underline">XM Studios</Link></li>
                    <li><Link href="/shop/studio/queen" className="hover:underline">Queen Studios</Link></li>
                  </ul>
                </div>
                <hr className="border-gray-600" />
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">SHOP BY License</h3>
                  <ul className="space-y-1">
                    <li><Link href="/shop/license/onepiece" className="hover:underline">One Piece</Link></li>
                    <li><Link href="/shop/license/naruto" className="hover:underline">Naruto</Link></li>
                  </ul>
                </div>
                <hr className="border-gray-600" />
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">SHOP BY Scale</h3>
                  <ul className="space-y-1">
                    <li><Link href="/shop/scale/1-6" className="hover:underline">1/6 Scale</Link></li>
                    <li><Link href="/shop/scale/1-4" className="hover:underline">1/4 Scale</Link></li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Icons */}
        <div className="flex items-center space-x-4">
          {/* Profile Icon */}
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
                  <div className="p-4">
                    <p className="font-bold">{session.user.name}</p>
                    <p className="text-sm text-gray-300">{session.user.email}</p>
                    <button
                      onClick={() => signOut()}
                      className="mt-4 bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="p-4">
                    <Link href="/login" className="hover:underline block text-center">Login</Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Icon */}
          <Link href="/cart" className="hover:underline">
            <FontAwesomeIcon icon={faShoppingCart} />
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
