
$functions = @(
    "aurora-application-builder",
    "aurora-interview-questions",
    "aurora-role-search",
    "cancel-subscription",
    "check-subscription",
    "create-checkout",
    "create-miro-board",
    "customer-portal",
    "generate-flashcards",
    "generate-personal-flashcards",
    "generate-personal-notes",
    "generate-personal-quiz",
    "generate-quiz",
    "grade-assessment",
    "learnspace-chat",
    "marketing-admin",
    "nexus-assessment-generator",
    "nexus-curriculum-generator",
    "nexus-lesson-generator",
    "notify-educator-message",
    "phoenix-realtime-token",
    "phoenix-text-chat",
    "resume-subscription",
    "send-career-application",
    "send-refund-request",
    "smart-assistant",
    "teacher-assistant"
)

foreach ($func in $functions) {
    Write-Host "🚀 Deploying $func ..."
    # Using cmd /c ensuring npx runs correctly in all shells
    cmd /c npx supabase functions deploy $func --project-ref ihfykcnicjdfbsibgcgn --no-verify-jwt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to deploy $func" -ForegroundColor Red
    } else {
        Write-Host "✅ Deployed $func" -ForegroundColor Green
    }
}
