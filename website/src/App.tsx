import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import Layout from '~/components/Layout'
import Home from '~/pages/Home'
import Features from '~/pages/Features'
import Docs from '~/pages/Docs'
import Changelog from '~/pages/Changelog'
import Roadmap from '~/pages/Roadmap'
import { siteRouter } from '~/lib/site'
import { productionBase } from '~/lib/siteBase'

function routes(hashRouting: boolean) {
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route index element={<Home />} />
				<Route path="features" element={<Features />} />
				<Route path="roadmap" element={<Roadmap />} />
				<Route path="docs" element={<Docs />} />
				{/* The hash build cannot carry a doc slug in the address hash the way the
				path build does (#slug), so the slug lives in the route instead. Production
				keeps only the plain `docs` route and its `#slug` anchors. */}
				{hashRouting && <Route path="docs/:slug" element={<Docs />} />}
				<Route path="changelog" element={<Changelog />} />
				<Route path="changelog/:version" element={<Changelog />} />
			</Route>
		</Routes>
	)
}

export default function App() {
	// The dev preview runs under /vibe/dev/, where GitHub Pages' single root
	// 404.html cannot serve path routes; its hashes never reach the server.
	if (siteRouter() === 'hash') return <HashRouter>{routes(true)}</HashRouter>

	return <BrowserRouter basename={productionBase.replace(/\/$/, '')}>{routes(false)}</BrowserRouter>
}
