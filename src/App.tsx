import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from '@/components/Layout/Layout'

// Pages are split per route: the inline SVG animations are the bulk of the bundle,
// so e.g. the contact page never downloads the bar scene.
const Home = lazy(() => import('@/pages/Home/Home').then((m) => ({ default: m.Home })))
const Recipes = lazy(() => import('@/pages/Recipes/Recipes').then((m) => ({ default: m.Recipes })))
const Recipe = lazy(() => import('@/pages/Recipe/Recipe').then((m) => ({ default: m.Recipe })))
const Contact = lazy(() => import('@/pages/Contact/Contact').then((m) => ({ default: m.Contact })))
const NotFound = lazy(() =>
  import('@/pages/NotFound/NotFound').then((m) => ({ default: m.NotFound })),
)

// Vite's BASE_URL is "/after-hours/"; the router wants it without the trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="recipes/:slug" element={<Recipe />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
