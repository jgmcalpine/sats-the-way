import { FSMChapter, FSMChapterEvent, FSMChapterTag } from '@/types/fsm';

export class FSMNavigator {
	private chapters: Map<string, FSMChapter> = new Map();
	private visited: string[] = [];
	private currentId?: string;

	constructor(events: FSMChapterEvent[]) {
		this.parse(events);
	}

	private parse(events: FSMChapterEvent[]) {
		// Step 1: parse all events into FSMChapters
		for (const event of events) {
			const chapter: FSMChapter = {
				id: this.getTagValue(event.tags, "id")!,
				title: this.getTagValue(event.tags, "title"),
				content: event.content,
				choices: [],
				paywall: undefined,
				isEnd: this.hasTag(event.tags, "end"),
				prompt: this.getTagValue(event.tags, "prompt"),
				contentType: this.getTagValue(event.tags, "content-type"),
			};

			for (const tag of event.tags) {
				if (tag[0] === "next") {
					const [_, nextId, __, choiceLabel] = tag;
					chapter.choices.push({
						nextId,
						label: choiceLabel,
					});
				}
				if (tag[0] === "paywall") {
					chapter.paywall = tag[2]; // lnurl
				}
			}

			this.chapters.set(chapter.id, chapter);
		}

		// Step 2: back link generation
		for (const [id, chapter] of this.chapters) {
			for (const choice of chapter.choices) {
				const next = this.chapters.get(choice.nextId);
				if (next && !next.previousId) {
					next.previousId = chapter.id;
				}
			}
		}
	}

	private getTagValue(tags: FSMChapterTag[], key: string): string | undefined {
		const tag = tags.find(t => t[0] === key);
		return tag ? tag[1] : undefined;
	}

	private hasTag(tags: FSMChapterTag[], key: string): boolean {
		return tags.some(t => t[0] === key && t[1] === "true");
	}

	public getCurrentChapter(): FSMChapter | undefined {
		return this.currentId ? this.chapters.get(this.currentId) : undefined;
	}

	public goTo(id: string) {
		if (this.chapters.has(id)) {
			this.currentId = id;
			if (!this.visited.includes(id)) this.visited.push(id);
		} else {
			throw new Error(`FSM: Chapter ${id} not found.`);
		}
	}

	public goNext(id: string) {
		this.goTo(id);
	}

	public goBack() {
		const current = this.getCurrentChapter();
		if (current?.previousId) {
			this.goTo(current.previousId);
		}
	}

	public getVisited(): string[] {
		return this.visited;
	}
}
