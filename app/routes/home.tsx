import Navbar from "~/components/Navbar"
import type { Route } from "./+types/home"
import ResumeCard from "~/components/ResumeCard"
import { usePuterStore } from "~/lib/puter"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Resumind" },
        { name: "description", content: "Des retours personnalisés et intelligents pour votre job de rêve!" },
    ]
}

export default function Home() {
    const { auth, kv } = usePuterStore()
    const navigate = useNavigate()
    const [resumes, setResumes] = useState<Resume[]>([])
    const [loadingResumes, setLoadingResumes] = useState(false)

    useEffect(() => {
        if (!auth.isAuthenticated) navigate("/auth?next=/")
    }, [auth.isAuthenticated])

    useEffect(() => {
        const loadResumes = async () => {
            setLoadingResumes(true)

            const resumes = (await kv.list("resume:*", true)) as KVItem[]

            const parsedResumes = resumes?.map(
                (resume) => JSON.parse(resume.value) as Resume
            )

            setResumes(parsedResumes || [])
            setLoadingResumes(false)
        }

        loadResumes()
    }, [])

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Suivez vos candidatures et les évaluations de CV</h1>
                    {!loadingResumes && resumes?.length === 0 ? (
                        <h2>
                            Aucun CV trouvé. Téléchargez votre premier CV pour obtenir
                            des retours.
                        </h2>
                    ) : (
                        <h2>
                            Consultez vos soumissions et vérifiez les retours
                            alimentés par l'IA
                        </h2>
                    )}
                </div>

                {loadingResumes && (
                    <div className="flex flex-col items-center justify-center">
                        <img
                            src="/images/resume-scan-2.gif"
                            alt=""
                            className="w-[200px]"
                        />
                    </div>
                )}

                {!loadingResumes && resumes.length > 0 && (
                    <div className="resumes-section">
                        {resumes.map((resume) => (
                            <ResumeCard key={resume.id} resume={resume} />
                        ))}
                    </div>
                )}

                {!loadingResumes && resumes?.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-10 gap-4">
                        <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
                            Télécharger un CV
                        </Link>
                    </div>
                )}
            </section>
        </main>
    )
}
