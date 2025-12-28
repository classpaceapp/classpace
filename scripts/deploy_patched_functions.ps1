
$functions = @(
    "auth-webhook",
    "create-checkout", 
    "check-subscription",
    "aurora-interview-questions",
    "nexus-lesson-generator", 
    "phoenix-text-chat", 
    "send-refund-request",
    "nexus-curriculum-generator",
    "nexus-assessment-generator",
    "grade-assessment",
    "search-web",
    "smart-assistant",
    "teacher-assistant",
    "generate-flashcards",
    "generate-quiz",
    "generate-personal-flashcards",
    "generate-personal-notes",
    "generate-personal-quiz",
    "aurora-application-builder",
    "aurora-role-search"
)

foreach ($func in $functions) {
    Write-Host "🚀 Deploying $func ..."
    # Explicitly using npx and WITHOUT --force
    cmd /c npx supabase functions deploy $func --project-ref ihfykcnicjdfbsibgcgn --no-verify-jwt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to deploy $func" -ForegroundColor Red
        exit 1
    }
    else {
        Write-Host "✅ Deployed $func" -ForegroundColor Green
    }
}
Write-Host "✨ All patched functions deployed successfully!" -ForegroundColor Green
