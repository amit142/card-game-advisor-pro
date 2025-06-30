pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE_NAME = "poker_app"
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    triggers {
        githubPush()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM', 
                    branches: [[name: '*/main']], 
                    userRemoteConfigs: [[
                        url: 'https://github.com/amit142/card-game-advisor-pro'
                    ]]
                ])
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    sh """
                        
                        echo "Current user: \$(whoami)"
                        echo "Building Docker image ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}..."
                        docker build -t "${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}" .
                    """
                }
            }
        }
        
        stage('Save Docker Image Artifact') {
            steps {
                script {
                    sh """
                        echo "Saving Docker image to a .tar file..."
                        docker save -o "${DOCKER_IMAGE_NAME}-${DOCKER_IMAGE_TAG}.tar" "${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
                    """
                }
                archiveArtifacts artifacts: '*.tar', fingerprint: true
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline finished.'
        }
        
        success {
            mail(
                to: 'amitbatito@gmail.com',
                subject: "SUCCESS: Jenkins Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}",
                body: "Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME} completed successfully. Docker image ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}.tar is available as an artifact."
            )
        }
        
        failure {
            mail(
                to: 'amitbatito@gmail.com',
                subject: "FAILURE: Jenkins Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}",
                body: "Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME} failed. Please check the Jenkins console output: ${BUILD_URL}"
            )
        }
    }
}
