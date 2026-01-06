import { DrawingCanvas } from "@/components/canvas/DrawingCanvas";
import { Helmet } from "react-helmet-async";


const Index = () => {
  return (
    <>
      <Helmet>
        <title>SketchFlow - Collaborative Drawing Canvas</title>
        <meta
          name="description"
          content="Create beautiful diagrams and sketches with SketchFlow, a collaborative whiteboard for teams and individuals."
        />
      </Helmet>

      <DrawingCanvas />
    </>
  );
};

export default Index;
