import { Composition } from "remotion";
import { MyComposition } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NesraAdvert"
        component={MyComposition}
        durationInFrames={765}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
