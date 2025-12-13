export default function FlightBoundsHelper({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <group>
      <gridHelper
        args={[5000, 100, "#00ff00", "#00ff0030"]}
        position={[0, 0, 0]}
      />
      <gridHelper
        args={[5000, 50, "#ffff00", "#ffff0020"]}
        position={[0, 500, 0]}
      />
      <gridHelper
        args={[5000, 50, "#ff8800", "#ff880020"]}
        position={[0, 1000, 0]}
      />
      <gridHelper
        args={[5000, 50, "#ff0000", "#ff000020"]}
        position={[0, 2000, 0]}
      />

      <axesHelper args={[200]} />
    </group>
  );
}
