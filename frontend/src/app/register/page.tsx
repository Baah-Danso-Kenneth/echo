import AuthForm from '../../components/AuthForm';

export default function RegisterPage() {
    return (
        <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
            <AuthForm mode="register" />
        </main>
    );
}
