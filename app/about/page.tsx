import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-white font-sf-rounded pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
            style={{
              fontFamily: "var(--font-sf-rounded)",
              letterSpacing: "0.0025em",
              lineHeight: "145%",
            }}
          >
            About Us
          </h1>

          <Card
            className="bg-card/80 backdrop-blur-sm border-border/50"
            style={{ borderRadius: "var(--wui-border-radius-m)" }}
          >
            <CardContent className="p-8 md:p-12">
              <p
                className="text-lg md:text-xl text-white leading-relaxed text-center"
                style={{
                  fontFamily: "var(--font-sf-rounded)",
                  lineHeight: "150%",
                  letterSpacing: "0.0015em",
                }}
              >
                BuildUnion is a collective of developers, designers, and strategists focused on Web3 tooling, DAO
                infrastructure, and decentralized governance. We operate as an integrated unit to deliver high-impact,
                production-grade applications.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
