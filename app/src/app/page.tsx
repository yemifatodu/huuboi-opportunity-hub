import OpportunityTable, { type Opportunity } from "../components/OpportunityTable";
import data from "../../data/opportunities.json";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">HUUBOI Opportunity Hub</h1>
        <p className="opacity-70">Directories, launch platforms and communities to get HUUBOI found.</p>
      </header>
      <OpportunityTable items={data as Opportunity[]} />
    </main>
  );
}
