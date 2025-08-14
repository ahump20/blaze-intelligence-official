import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useSportsData } from '../contexts/SportsDataContext';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  const { isConnected } = useSportsData();

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Profile', href: '/profile' },
    { name: 'Subscription', href: '/subscription' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold gradient-text">Blaze Intelligence</span>
              {isConnected && (
                <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live data connected" />
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blaze-500 transition-colors">
              Home
            </Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-gray-700 hover:text-blaze-500 transition-colors">
                Dashboard
              </Link>
            )}
            <Link to="/analytics" className="text-gray-700 hover:text-blaze-500 transition-colors">
              Analytics
            </Link>
            <Link to="/demo" className="text-gray-700 hover:text-blaze-500 transition-colors">
              Demo
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blaze-500 transition-colors">
              Contact
            </Link>

            {/* User Menu or Login Button */}
            {isAuthenticated && user ? (
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blaze-500">
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f83b3b&color=fff`}
                      alt={user.name}
                    />
                    <span className="text-gray-700">{user.name}</span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs">{user.subscription?.plan.toUpperCase()} Plan</div>
                    </div>
                    {userNavigation.map((item) => (
                      <Menu.Item key={item.name}>
                        {({ active }) => (
                          <Link
                            to={item.href}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            {item.name}
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={logout}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex items-center space-x-4">
                {!isLoading && (
                  <>
                    <button
                      onClick={login}
                      className="text-gray-700 hover:text-blaze-500 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={login}
                      className="gradient-blaze text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blaze-500 focus:outline-none"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/analytics"
                className="block px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                onClick={() => setIsOpen(false)}
              >
                Analytics
              </Link>
              <Link
                to="/demo"
                className="block px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                onClick={() => setIsOpen(false)}
              >
                Demo
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              
              {isAuthenticated && user ? (
                <>
                  <div className="border-t pt-4 pb-3">
                    <div className="flex items-center px-5">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f83b3b&color=fff`}
                        alt={user.name}
                      />
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">{user.name}</div>
                        <div className="text-sm font-medium text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {userNavigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="block px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                      <button
                        onClick={logout}
                        className="block w-full text-left px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                !isLoading && (
                  <div className="border-t pt-4 pb-3 space-y-1">
                    <button
                      onClick={login}
                      className="block w-full text-left px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={login}
                      className="w-full gradient-blaze text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Get Started
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;