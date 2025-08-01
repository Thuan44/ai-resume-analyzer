import Navbar from "~/components/Navbar"
import { useEffect, useState, type FormEvent } from "react"
import FileUploader from "~/components/FileUploader"
import { usePuterStore } from "~/lib/puter"
import { useNavigate } from "react-router"
import { convertPdfToImage } from "~/lib/pdf2img"
import { generateUUID } from "~/lib/utils"
import { prepareInstructions } from "constants"

const Upload = () => {
    const { auth, fs, ai, kv } = usePuterStore()
    const navigate = useNavigate()
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusText, setStatusText] = useState("")
    const [file, setFile] = useState<File | null>(null)

    useEffect(() => {
        if (!auth.isAuthenticated) navigate("/auth?next=/upload")
    }, [auth.isAuthenticated])

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({
        companyName,
        jobTitle,
        jobDescription,
        file,
    }: {
        companyName: string
        jobTitle: string
        jobDescription: string
        file: File
    }) => {
        setIsProcessing(true)
        setStatusText("Téléchargement du fichier en cours...")

        const uploadedFile = await fs.upload([file])
        if (!uploadedFile)
            return setStatusText("Échec du téléchargement du fichier.")

        setStatusText("Conversion en image...")
        const imageFile = await convertPdfToImage(file)
        console.log("Converted image file:", imageFile)
        if (!imageFile.file)
            return setStatusText(
                "Erreur : Échec de la conversion du PDF en image."
            )

        setStatusText("Téléchargement de l'image en cours...")
        const uploadedImage = await fs.upload([imageFile.file])
        if (!uploadedImage)
            return setStatusText("Échec du téléchargement de l'image.")

        setStatusText("Préparation des données...")

        const uuid = generateUUID()
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName,
            jobTitle,
            jobDescription,
            feedback: "",
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data))

        setStatusText("Analyse en cours...")

        const feedback = await ai.feedback(
            uploadedFile.path,
            prepareInstructions({ jobTitle, jobDescription })
        )
        if (!feedback)
            return setStatusText("Erreur : Échec de l'analyse du CV.")

        const feedbackText =
            typeof feedback.message.content === "string"
                ? feedback.message.content
                : feedback.message.content[0].text

        data.feedback = JSON.parse(feedbackText)
        await kv.set(`resume:${uuid}`, JSON.stringify(data))
        setStatusText("Analyse terminée ! Redirection...")

        navigate(`/resume/${uuid}`)
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const form = event.currentTarget.closest("form")
        if (!form) return
        const formData = new FormData(form)

        const companyName = formData.get("company-name") as string
        const jobTitle = formData.get("job-title") as string
        const jobDescription = formData.get("job-description") as string

        if (!file) return

        handleAnalyze({ companyName, jobTitle, jobDescription, file })
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>
                        Des retours personnalisés et intelligents pour votre job
                        de rêve
                    </h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img
                                src="/images/resume-scan.gif"
                                alt=""
                                className="w-full"
                            />
                        </>
                    ) : (
                        <h2>
                            Déposez votre CV pour obtenir un score ATS et des
                            conseils d'amélioration
                        </h2>
                    )}
                    {!isProcessing && (
                        <form
                            id="upload-form"
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4 mt-8"
                        >
                            <div className="form-div">
                                <label htmlFor="company-name">
                                    Nom de l'entreprise
                                </label>
                                <input
                                    type="text"
                                    id="company-name"
                                    name="company-name"
                                    placeholder="Nom de l'entreprise"
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Nom du poste</label>
                                <input
                                    type="text"
                                    id="job-title"
                                    name="job-title"
                                    placeholder="Nom du poste"
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">
                                    Description du poste
                                </label>
                                <textarea
                                    id="job-description"
                                    name="job-description"
                                    placeholder="Description du poste"
                                    rows={5}
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader">
                                    Télécharger un CV
                                </label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>
                            <button className="primary-button" type="submit">
                                Analyser le CV
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Upload
