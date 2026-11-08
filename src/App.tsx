import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from '@/components/Layout/Layout'
import { Contact } from '@/pages/Contact/Contact'
import { Home } from '@/pages/Home/Home'
import { NotFound } from '@/pages/NotFound/NotFound'
import { Recipe } from '@/pages/Recipe/Recipe'
import { Recipes } from '@/pages/Recipes/Recipes'

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
