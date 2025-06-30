pipeline:
  agent: any 
  
  triggers:
    - githubPush: 
        branches: main

  environment:
    DOCKER_IMAGE_NAME: "poker_app" 
    DOCKER_IMAGE_TAG: "${BUILD_NUMBER}" 

  stages:
    - stage: 'Checkout'
      steps:
        - checkout:
            scm:
              git:
                url: "https://github.com/amit142/card-game-advisor-pro" 
                branch: "main"
                # credentialsId: "your-github-credentials-id" 

    - stage: 'Build Docker Image'
      steps:
        - script: |
            echo "Building Docker image ${env.DOCKER_IMAGE_NAME}:${env.DOCKER_IMAGE_TAG}..."
            docker build -t "${env.DOCKER_IMAGE_NAME}:${env.DOCKER_IMAGE_TAG}" .

    - stage: 'Save Docker Image Artifact'
      steps:
        - script: |
            echo "Saving Docker image to a .tar file..."
            docker save -o "${env.DOCKER_IMAGE_NAME}-${env.DOCKER_IMAGE_TAG}.tar" "${env.DOCKER_IMAGE_NAME}:${env.DOCKER_IMAGE_TAG}"
        - archiveArtifacts:
            artifacts: "*.tar"
            fingerprint: true # Optional: helps track artifact usage

  post:
    always: # Runs regardless of pipeline status, good for cleanup if needed
      - echo 'Pipeline finished.'
    success:
      - mail:
          to: 'amitbatito@gmail.com'
          subject: "SUCCESS: Jenkins Build #${BUILcardD_NUMBER} for ${env.DOCKER_IMAGE_NAME}"
          body: "Build #${BUILD_NUMBER} for ${env.DOCKER_IMAGE_NAME} completed successfully. Docker image ${env.DOCKER_IMAGE_NAME}:${env.DOCKER_IMAGE_TAG}.tar is available as an artifact."
    failure:
      - mail:
          to: 'amitbatito@gmail.com'
          subject: "FAILURE: Jenkins Build #${BUILD_NUMBER} for ${env.DOCKER_IMAGE_NAME}"
          body: "Build #${BUILD_NUMBER} for ${env.DOCKER_IMAGE_NAME} failed. Please check the Jenkins console output: ${BUILD_URL}"


