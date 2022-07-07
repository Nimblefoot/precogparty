// These are customized
import "@/styles/solanaWalletAdapter.css"
import "../styles/globals.css"
import type { AppProps } from "next/app"
import Image from "next/image"
import Blockies from "react-blockies"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useWallet } from "@solana/wallet-adapter-react"

/* This example requires Tailwind CSS v2.0+ */
import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import {
  CollectionIcon,
  MenuIcon,
  PlusCircleIcon,
  TrendingUpIcon,
  XIcon,
} from "@heroicons/react/outline"
import Providers from "./providers"
import { useRouter } from "next/router"
import Link from "next/link"
import { useTokenAccount } from "./tokenAccountQuery"
import { COLLATERAL_MINT } from "config"
import { displayBN } from "src/utils/BNutils"
import BN from "bn.js"
import clsx from "clsx"
import useAirdrop from "src/hooks/useAirdrop"

const navigation = [
  //{ name: "Home", href: "#", icon: HomeIcon },
  {
    name: "Markets",
    href: "/markets/browse",
    icon: CollectionIcon,
  },

  { name: "Positions", href: "/positions", icon: TrendingUpIcon },
  { name: "New market", href: "/markets/new", icon: PlusCircleIcon },

  // { name: "About", href: "#", icon: CalendarIcon },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

const Layout = ({ Component, pageProps }: AppProps) => {
  const { route } = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Providers>
        <div>
          <Transition.Root show={sidebarOpen} as={Fragment}>
            <Dialog
              as="div"
              className="fixed inset-0 flex z-40 md:hidden"
              onClose={setSidebarOpen}
            >
              <Transition.Child
                as={Fragment}
                enter="transition-opacity ease-linear duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity ease-linear duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
              </Transition.Child>
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                      <button
                        type="button"
                        className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <XIcon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4 gap-3 bg-white">
                      <Image
                        src="/precogs.svg"
                        height={35}
                        width={35}
                        alt="precog logo"
                      />
                      <div
                        className="text-lg mb-1"
                        style={{
                          fontFamily: "'Quicksand', sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        precog.markets
                      </div>
                    </div>
                    <nav className="mt-5 px-2 space-y-1">
                      {navigation.map((item) => (
                        <Link key={item.name} href={item.href} passHref>
                          <a
                            className={classNames(
                              route === item.href
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                              "group flex items-center px-2 py-2 text-base font-medium rounded-md"
                            )}
                          >
                            <item.icon
                              className={classNames(
                                route === item.href
                                  ? "text-gray-500"
                                  : "text-gray-400 group-hover:text-gray-500",
                                "mr-4 flex-shrink-0 h-6 w-6"
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </a>
                        </Link>
                      ))}
                    </nav>
                  </div>
                  <UserInfoMobile />
                </div>
              </Transition.Child>
              <div className="flex-shrink-0 w-14">
                {/* Force sidebar to shrink to fit close icon */}
              </div>
            </Dialog>
          </Transition.Root>

          {/* Static sidebar for desktop */}
          <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
            {/* Sidebar component, swap this element with another sidebar if you like */}
            <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto gap-5">
                <div className="flex items-center flex-shrink-0 px-4 gap-3 bg-white">
                  <Image
                    src="/precogs.svg"
                    height={35}
                    width={35}
                    alt="precog logo"
                  />
                  <div
                    className="text-lg mb-1"
                    style={{
                      fontFamily: "'Quicksand', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    precog.markets
                  </div>
                </div>
                <UserInfoDesktop />

                <nav className="flex-1 px-2 bg-white space-y-1">
                  {navigation.map((item) => (
                    <Link key={item.name} href={item.href} passHref>
                      <a
                        className={classNames(
                          route === item.href
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                        )}
                      >
                        <item.icon
                          className={classNames(
                            route === item.href
                              ? "text-gray-500"
                              : "text-gray-400 group-hover:text-gray-500",
                            "mr-3 flex-shrink-0 h-6 w-6"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          <div className="md:pl-64 flex flex-col flex-1">
            <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white">
              <button
                type="button"
                className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <main className="flex-1">
              <div className="py-6">
                {/* @ts-ignore  */}
                <Component {...pageProps} />
              </div>
            </main>
          </div>
        </div>
      </Providers>
    </>
  )
}

export default Layout

const ConnectWallet = () => {}

function UserInfoDesktop({}) {
  const { publicKey } = useWallet()
  const balance = useTokenAccount(COLLATERAL_MINT)
  const { airdrop, status } = useAirdrop()

  return (
    <>
      <div className="flex-shrink-0 flex border-t border-b border-gray-200 p-4">
        {!publicKey ? (
          <WalletMultiButton
            startIcon={undefined}
            endIcon={undefined}
            style={{
              lineHeight: "0px",
            }}
            className="h-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          />
        ) : (
          //<a href="#" className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div
              className="inline-block h-10 w-10 rounded-full overflow-hidden" /* optional class name for the canvas element; "identicon" by default */
            >
              <Blockies
                seed={publicKey.toString()} /* the only required prop; determines how the image is generated */
                size={10}
                scale={
                  4
                } /* width/height of each square in pixels; default = 4 */
                //className="inline-block h-8 w-8 rounded-full"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {publicKey.toString().substring(0, 4) +
                  ".." +
                  publicKey
                    .toString()
                    .substring(publicKey.toString().length - 4)}
              </p>
              {/*  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                  View profile
                </p> */}

              {
                <p className="text-xs text-gray-700 whitespace-nowrap">
                  $
                  {displayBN(
                    new BN(
                      balance.data && balance.data !== "no account"
                        ? balance.data.value.amount
                        : 0
                    )
                  )}
                  {process.env.NEXT_PUBLIC_RPC !==
                  "https://api.mainnet-beta.solana.com" ? (
                    <button
                      onClick={airdrop}
                      className={clsx(
                        "ml-1",
                        "inline-flex items-center px-1 py-0.5 border border-transparent text-xs font-medium rounded",
                        "border bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-700"
                      )}
                    >
                      {status === "initial" || status === "done"
                        ? "airdrop"
                        : status === "sending"
                        ? "Sending..."
                        : status === "signing"
                        ? "Signing..."
                        : "Confirming..."}
                    </button>
                  ) : null}
                </p>
              }
            </div>
          </div>
          //</a>
        )}
      </div>
    </>
  )
}

function UserInfoMobile({}) {
  return <UserInfoDesktop />
}
