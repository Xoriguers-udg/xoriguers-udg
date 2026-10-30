"""Genera arbre.html (app interactiva autònoma) a partir dels CSV.

Ús: python build_tree.py [xoriguers.csv] [apadrinatge.csv] [arbre.html]
"""
import argparse
import csv
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEMPLATE_FILE = HERE / "template.html"
DATA_MARKER = "/*__DATA__*/null"


def read_people(path):
    """Return ({name: year}, issues). Rows that can't be used become issues."""
    people, issues = {}, []
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            name = row["xoriguer"].strip()
            raw_year = row["any"].strip()
            if not raw_year.lstrip("-").isdigit():
                issues.append(f"{name}: any no vàlid «{raw_year}»")
            elif name in people and people[name] != int(raw_year):
                issues.append(f"{name}: dos anys diferents ({people[name]} i {raw_year}), es manté {people[name]}")
            else:
                people.setdefault(name, int(raw_year))
    return people, issues


def read_relations(path, people):
    """Return (valid (padri, fillol) pairs, issues)."""
    relations, issues = [], []
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            padri, fillol = row["padri"].strip(), row["fillol"].strip()
            missing = [name for name in (padri, fillol) if name not in people]
            if missing:
                issues.append(f"{padri} → {fillol}: sense any a xoriguers.csv ({', '.join(missing)})")
            elif people[padri] >= people[fillol]:
                issues.append(
                    f"{padri} ({people[padri]}) → {fillol} ({people[fillol]}): "
                    "el padrí ha d'haver entrat abans que el fillol"
                )
            elif (padri, fillol) not in relations:
                relations.append((padri, fillol))
    return relations, issues


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("people", nargs="?", default=HERE / "xoriguers.csv")
    parser.add_argument("relations", nargs="?", default=HERE / "apadrinatge.csv")
    parser.add_argument("output", nargs="?", default=HERE / "arbre.html")
    args = parser.parse_args()

    people, people_issues = read_people(args.people)
    relations, relation_issues = read_relations(args.relations, people)
    issues = people_issues + relation_issues

    data = {
        "people": [{"name": name, "year": year} for name, year in people.items()],
        "relations": [{"padri": p, "fillol": f} for p, f in relations],
        "issues": issues,
    }
    # "<" is escaped so that a name can never close the inline <script>.
    payload = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")
    html = TEMPLATE_FILE.read_text(encoding="utf-8").replace(DATA_MARKER, payload)
    Path(args.output).write_text(html, encoding="utf-8")

    print(f"{len(people)} xoriguers, {len(relations)} relacions -> {args.output}")
    for issue in issues:
        print(f"  AVÍS: {issue}")


if __name__ == "__main__":
    main()
