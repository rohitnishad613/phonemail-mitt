import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { MailQuestionMark } from "lucide-react";

export default function FilterList() {
  return (
    <section className="px-8 flex gap-2 overflow-x-auto mx-auto max-w-5xl px-8">
        <ButtonGroup>
            <Button className="rounded-full px-4" variant="secondary">All</Button>
        </ButtonGroup>
        <ButtonGroup className="rounded-full">
            <Button size="icon" variant="outline">
                <MailQuestionMark />
            </Button>
            <Button variant="outline">Unread</Button>
        </ButtonGroup>
    </section>
  )
}
