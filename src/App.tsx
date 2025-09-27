import { useState } from 'react'
import { LandingPage } from './components/landing-page'
import { NotesApp } from './components/notes-app'

export function App() {
    const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing')

    const navigateToDashboard = () => {
        setCurrentView('dashboard')
    }

    const navigateToLanding = () => {
        setCurrentView('landing')
    }

    if (currentView === 'landing') {
        return <LandingPage onNavigateToDashboard={navigateToDashboard} />
    }

    return <NotesApp onNavigateToLanding={navigateToLanding} />
}
