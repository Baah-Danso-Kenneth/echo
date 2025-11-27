import AuthForm from '../../components/AuthForm';

export default function LoginPage() {
    return (
        <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
            <AuthForm mode="login" />
        </main>
    );
}
