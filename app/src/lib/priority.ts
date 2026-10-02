export type Project = "huuboi" | "portfolio";

type Item = {
  name: string;
  domain: string;
  categories: string[];
  fee: string;
  domainRank: number | null;
};

const has = (re: RegExp, i: Item) => re.test(`${i.name} ${i.domain}`);

export function scoreFor(project: Project, i: Item): number {
  let s = (i.domainRank ?? 0) / 10;
  if (i.fee === "free") s += 3;
  else if (i.fee === "paid") s -= 1;
  const c = i.categories;

  if (project === "huuboi") {
    if (has(/travel|trip|tour|hotel|flight|booking|tripadvisor|esim|vacation|holiday/i, i)) s += 8;
    if (has(/trustpilot|google|bing|yelp|bbb|better business|sitejabber|reviews?/i, i)) s += 4;
    if (c.includes("launch-platforms")) s += 4;
    if (c.includes("social-communities")) s += 2;
    if (c.includes("directories")) s += 1;
    if (c.includes("reddit-growth-tools")) s += 1;
    if (c.includes("faceless-youtube-tools")) s -= 4;
  } else {
    if (c.includes("design-showcases")) s += 6;
    if (c.includes("writing-publishing-platforms")) s += 5;
    if (c.includes("publications")) s += 3;
    if (c.includes("social-communities")) s += 3;
    if (c.includes("launch-platforms")) s += 3;
    if (has(/github|devhunt|dev\.to|peerlist|behance|dribbble|medium|hashnode|kaggle|awwwards|indie|portfolio|showcase/i, i)) s += 4;
    if (c.includes("faceless-youtube-tools")) s -= 4;
  }
  return Math.round(s * 10) / 10;
}
