'use client';

import { useAuth } from "@/components/AuthProvider";
import SimpleTextInput from '@/components/ui/SimpleTextInput';
import DraftBookList from '@/components/ui/DraftBookList';

export default function WritePage() {
    const { currentUser, loading } = useAuth();

    if (loading) return;

    const onSubmitText = (text: string) => {
        console.log("should submit here", text);
    }

    return (
        <div className="flex flex-col justify-center items-center h-full min-h-screen">
            <DraftBookList />
            This is where we will write

            {currentUser && (
                <SimpleTextInput onSubmit={onSubmitText} />
            )}
        </div>
    )
}