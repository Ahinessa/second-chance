export function SizeTable() {
  const clothing = [
    ['XS', '40–42', '34–36', '0–2', 'Б 78–84 · Т 58–64 · Б 84–90'],
    ['S', '42–44', '36–38', '2–4', 'Б 84–90 · Т 64–70 · Б 90–96'],
    ['M', '44–46', '38–40', '4–6', 'Б 90–96 · Т 70–76 · Б 96–102'],
    ['L', '46–48', '40–42', '6–8', 'Б 96–102 · Т 76–82 · Б 102–108'],
    ['XL', '48–50', '42–44', '8–10', 'Б 102–110 · Т 82–90 · Б 108–116'],
    ['XXL', '50–52', '44–46', '10–12', 'Б 110–118 · Т 90–98 · Б 116–124']
  ];

  const shoes = [
    ['35', '35', '5', '22.5'],
    ['36', '36', '6', '23'],
    ['37', '37', '6.5', '23.5'],
    ['38', '38', '7.5', '24'],
    ['39', '39', '8.5', '24.5'],
    ['40', '40', '9', '25'],
    ['41', '41', '10', '26'],
    ['42', '42', '11', '26.5'],
    ['43', '43', '12', '27.5']
  ];

  return (
    <div className="size-content">
      <h3>ОДЕЖДА · ЖЕНСКАЯ (ОРИЕНТИРОВОЧНО)</h3>
      <div className="table-scroll">
        <table className="size-table">
          <thead>
            <tr><th>INT</th><th>RU</th><th>EU</th><th>US</th><th>МЕРКИ, СМ</th></tr>
          </thead>
          <tbody>
            {clothing.map(r => (
              <tr key={r[0]}>{r.map((v, i) => <td key={i}>{v}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="size-note">Б — грудь / Т — талия / Б — бёдра. Сверяйте мерки конкретной вещи: винтаж и бренды могут отличаться.</p>
      <h3>ОБУВЬ</h3>
      <div className="table-scroll">
        <table className="size-table">
          <thead>
            <tr><th>RU / EU</th><th>EU</th><th>US</th><th>СТОПА, СМ</th></tr>
          </thead>
          <tbody>
            {shoes.map(r => (
              <tr key={r[0]}>{r.map((v, i) => <td key={i}>{v}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
