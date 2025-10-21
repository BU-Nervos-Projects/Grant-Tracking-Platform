import { Card, CardContent } from "@/components/ui/card"
import { Project } from "@/lib/types"

interface ProjectBannerProps {
  project: Project
}

export function ProjectBanner({ project }: ProjectBannerProps) {
  return (
    <Card
      className="bg-card/80 backdrop-blur-sm border-border/50 mb-6"
      style={{ borderRadius: "var(--wui-border-radius-m)" }}
    >
      <CardContent className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[128px] md:min-h-[192px] bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
          <div className="text-center px-4 py-4 max-w-full">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-lg md:text-2xl font-bold text-purple-600">
                {project.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 break-words">
              {project.name.length > 60 ? `${project.name.slice(0, 60)}...` : project.name}
            </h2>
            <p
              className="text-xs sm:text-sm md:text-base text-purple-100 leading-tight sm:leading-normal md:leading-relaxed break-words hyphens-auto max-w-full px-2"
              style={{
                wordWrap: "break-word",
                overflowWrap: "break-word",
                lineHeight: "1.3",
              }}
            >
              {project.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
