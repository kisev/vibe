import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import Layout from '~/components/Layout'
import Home from '~/pages/Home'
import Features from '~/pages/Features'
import Docs from '~/pages/Docs'
import Changelog from '~/pages/Changelog'
import Roadmap from '~/pages/Roadmap'
import { siteRouter } from '~/lib/site'

const routes = (
	<Routes>
		<Route element={<Layout />}>
			<Route index element={<Home />} />
			<Route path="features" element={<Features />} />
			<Route path="roadmap" element={<Roadmap />} />
			<Route path="docs" element={<Docs />} />
			<Route path="changelog" element={<Changelog />} />
			<Route path="changelog/:version" element={<Changelog />} />
		</Route>
	</Routes>
)

export default function App() {
	// The dev preview runs under /vibe/dev/, where GitHub Pages' single root
	// 404.html cannot serve path routes; its hashes never reach the server.
	if (siteRouter() === 'hash') return <HashRouter>{routes}</HashRouter>

	return <BrowserRouter basename="/vibe">{routes}</BrowserRouter>
}
