import Container from "@/components/common/layout/container";
import DefaultLayout from "@/components/common/layout/default-layout";
import Section from "@/components/common/layout/section";

export default function Home() {
  return (
    <DefaultLayout>
      <Container>
        <Section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
            New Project
          </h1>
          <p className="mt-3 max-w-md text-lg text-muted-foreground">
            A sandbox playground for experimenting with ideas.
          </p>
        </Section>
      </Container>
    </DefaultLayout>
  );
}
