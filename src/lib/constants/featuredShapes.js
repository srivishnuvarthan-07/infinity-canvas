export const QUICK_ACCESS_SHAPES = [
  {
    id: "qa-sticky", name: "Sticky Note",
    shapes: [
      { id: "s1", type: "rectangle", position: { x: 0, y: 0 }, size: { width: 140, height: 140 },
        style: { fill: "#fff3bf", stroke: "#f5c518", strokeWidth: 1, roughness: 1.5 } },
      { id: "s2", type: "text", text: "Note", position: { x: 35, y: 55 }, size: { width: 70, height: 30 },
        font: { size: 22, family: "Caveat", align: "center" }, style: { fill: "#5c4a00" } }
    ]
  },
  {
    id: "qa-process", name: "Process",
    shapes: [
      { id: "p1", type: "rectangle", position: { x: 0, y: 0 }, size: { width: 140, height: 60 },
        style: { fill: "#e7f5ff", stroke: "#339af0", strokeWidth: 2, roughness: 1.5 } },
      { id: "p2", type: "text", text: "Process", position: { x: 25, y: 18 }, size: { width: 90, height: 24 },
        font: { size: 16, family: "Arial", align: "center", weight: "600" }, style: { fill: "#1864ab" } }
    ]
  },
  {
    id: "qa-decision", name: "Decision",
    shapes: [
      { id: "d1", type: "diamond", position: { x: 0, y: 0 }, size: { width: 110, height: 110 },
        style: { fill: "#f3e8ff", stroke: "#9c36b5", strokeWidth: 2, roughness: 1.5 } },
      { id: "d2", type: "text", text: "Yes/No", position: { x: 20, y: 43 }, size: { width: 70, height: 24 },
        font: { size: 15, family: "Arial", align: "center", weight: "600" }, style: { fill: "#6a1b8c" } }
    ]
  },
  {
    id: "qa-terminal", name: "Start / End",
    shapes: [
      { id: "t1", type: "ellipse", position: { x: 0, y: 0 }, size: { width: 130, height: 54 },
        style: { fill: "#ebfbee", stroke: "#37b24d", strokeWidth: 2, roughness: 1.5 } },
      { id: "t2", type: "text", text: "Start", position: { x: 35, y: 15 }, size: { width: 60, height: 24 },
        font: { size: 16, family: "Arial", align: "center", weight: "bold" }, style: { fill: "#2b8a3e" } }
    ]
  },
  {
    id: "qa-database", name: "Database",
    shapes: [
      { id: "db1", type: "cylinder", position: { x: 0, y: 0 }, size: { width: 90, height: 110 },
        style: { fill: "#fff4e6", stroke: "#f76707", strokeWidth: 2, roughness: 1.5 } },
      { id: "db2", type: "text", text: "DB", position: { x: 25, y: 50 }, size: { width: 40, height: 22 },
        font: { size: 16, family: "Arial", align: "center", weight: "bold" }, style: { fill: "#c2410c" } }
    ]
  },
  {
    id: "qa-document", name: "Document",
    shapes: [
      { id: "doc1", type: "document", position: { x: 0, y: 0 }, size: { width: 90, height: 110 },
        style: { fill: "#f1f3f5", stroke: "#868e96", strokeWidth: 2, roughness: 1.5 } },
      { id: "doc2", type: "text", text: "Doc", position: { x: 22, y: 40 }, size: { width: 46, height: 22 },
        font: { size: 15, family: "Arial", align: "center", weight: "600" }, style: { fill: "#495057" } }
    ]
  },
  {
    id: "qa-cloud", name: "Cloud / Network",
    shapes: [
      { id: "c1", type: "ellipse", position: { x: 20, y: 0 }, size: { width: 60, height: 40 },
        style: { fill: "#e3fafc", stroke: "#15aabf", strokeWidth: 2 } },
      { id: "c2", type: "ellipse", position: { x: 0, y: 20 }, size: { width: 50, height: 40 },
        style: { fill: "#e3fafc", stroke: "#15aabf", strokeWidth: 2 } },
      { id: "c3", type: "ellipse", position: { x: 50, y: 20 }, size: { width: 60, height: 40 },
        style: { fill: "#e3fafc", stroke: "#15aabf", strokeWidth: 2 } },
      { id: "c4", type: "ellipse", position: { x: 25, y: 30 }, size: { width: 60, height: 30 },
        style: { fill: "#e3fafc", stroke: "#15aabf", strokeWidth: 2 } }
    ]
  },
  {
    id: "qa-user", name: "User / Actor",
    shapes: [
      { id: "u1", type: "ellipse", position: { x: 20, y: 0 }, size: { width: 40, height: 40 },
        style: { fill: "#f1f3f5", stroke: "#495057", strokeWidth: 2 } },
      { id: "u2", type: "line", position: { x: 40, y: 40 }, points: [{x:0,y:0},{x:0,y:40}],
        style: { stroke: "#495057", strokeWidth: 2 } },
      { id: "u3", type: "line", position: { x: 15, y: 50 }, points: [{x:0,y:0},{x:50,y:0}],
        style: { stroke: "#495057", strokeWidth: 2 } },
      { id: "u4", type: "line", position: { x: 40, y: 80 }, points: [{x:0,y:0},{x:-20,y:30}],
        style: { stroke: "#495057", strokeWidth: 2 } },
      { id: "u5", type: "line", position: { x: 40, y: 80 }, points: [{x:0,y:0},{x:20,y:30}],
        style: { stroke: "#495057", strokeWidth: 2 } }
    ]
  },
  {
    id: "qa-arrow", name: "Data Flow Arrow",
    shapes: [
      { id: "a1", type: "arrow", position: { x: 0, y: 0 }, points: [{x:0,y:0},{x:100,y:0}],
        arrow: { startHead: "none", endHead: "triangle" },
        style: { stroke: "#1971c2", strokeWidth: 3, roughness: 1.5 } }
    ]
  },
  {
    id: "qa-heading", name: "Text Heading",
    shapes: [
      { id: "h1", type: "text", text: "Heading", position: { x: 0, y: 0 }, size: { width: 150, height: 40 },
        font: { size: 30, family: "Arial", align: "left", weight: "bold" }, style: { fill: "#1a1a1a" } }
    ]
  }
];