
$functions = @(
    "nexus-lesson-generator", 
    "phoenix-text-chat", 
    "nexus-curriculum-generator",
    "nexus-assessment-generator",
    "grade-assessment",
    "smart-assistant",
    "teacher-assistant",
    "generate-flashcards"
)

foreach ($func in $functions) {
    Write-Host "🚀 Deploying $func ..."
    cmd /c npx supabase functions deploy $func --project-ref ihfykcnicjdfbsibgcgn --no-verify-jwt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to deploy $func" -ForegroundColor Red
        # Continue even if one fails
    }
    else {
        Write-Host "✅ Deployed $func" -ForegroundColor Green
    }
}
Write-Host "✨ Math fix functions deployment attempt complete!" -ForegroundColor Green
