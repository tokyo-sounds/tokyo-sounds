import CommonPageContainer from "@/components/layout/CommonPageContainer";
import ChatbotContainer from "./components/ChatbotContainer";

export default function Page() {
  return (
    <CommonPageContainer
      className="pt-8"
      innerClassName="bg-background rounded-3xl shadow-xl"
    >
      <ChatbotContainer />
    </CommonPageContainer>
  );
}
