"use client";

import React, { useEffect, useState } from "react";
import { FSMNavigator } from "@/lib/fsm";
import { FSMChapter, FSMChapterEvent } from '@/types/fsm';
import { mockFSMEvents } from "@/constants/mock";

let fsm: FSMNavigator;

export default function FSMReader() {
	const [current, setCurrent] = useState<FSMChapter | undefined>();

	useEffect(() => {
		// Initialize FSM once on mount
		fsm = new FSMNavigator(mockFSMEvents as FSMChapterEvent[]);
		fsm.goTo("chapter-1"); // Starting point
		setCurrent(fsm.getCurrentChapter());
	}, []);

	function goNext(nextId: string) {
		try {
			fsm.goNext(nextId);
			setCurrent(fsm.getCurrentChapter());
		} catch (e) {
			alert("Could not go to next chapter: " + e);
		}
	}

	function goBack() {
		try {
			fsm.goBack();
			setCurrent(fsm.getCurrentChapter());
		} catch (e) {
			alert("Could not go back.");
		}
	}

	if (!current) return <div>Loading story...</div>;

	return (
		<div className="p-4 max-w-xl mx-auto">
			<h2 className="text-2xl font-bold mb-2">{current.title}</h2>
			<p className="text-sm text-gray-500 mb-4">{current.prompt}</p>
			<div className="border p-4 rounded bg-white shadow mb-4">
				<pre className="whitespace-pre-wrap">{current.content}</pre>
			</div>

			{current.choices.length > 0 && (
				<div className="space-y-2">
					{current.choices.map((c, i) => (
						<button
							key={i}
							onClick={() => goNext(c.nextId)}
							className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
						>
							{c.label ?? `Go to ${c.nextId}`}
						</button>
					))}
				</div>
			)}

			{current.choices.length === 0 && !current.isEnd && (
				<button
					onClick={() => goNext(current.id)}
					className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
				>
					Continue
				</button>
			)}

			{current.previousId && (
				<button
					onClick={goBack}
					className="mt-4 px-4 py-2 bg-gray-300 text-black rounded"
				>
					Back
				</button>
			)}
		</div>
	);
}
