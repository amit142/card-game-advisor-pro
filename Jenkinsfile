pipeline {
    agent {
        label 'docker'  // Use the label you assigned to your Docker slave
    }

    environment {
        DOCKER_IMAGE_NAME = "poker_app"
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    triggers {
        githubPush()
        
        //pollSCM('H/5 * * * *') // Poll every 5 minutes as fallback
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }
    
    stages {
        stage('Verify Agent') {
            steps {
                script {
                    echo "Running on agent: ${env.NODE_NAME}"
                    echo "Agent labels: ${env.NODE_LABELS}"
                    echo "Workspace: ${env.WORKSPACE}"
                    sh 'hostname'
                    sh 'whoami'
                    sh 'pwd'
                }
            }
        }
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM', 
                    branches: [[name: '*/main']], 
                    userRemoteConfigs: [[
                        url: 'https://github.com/amit142/card-game-advisor-pro'
                    ]],
                    extensions: [
                        [$class: 'CleanBeforeCheckout'],
                        [$class: 'CloneOption', depth: 1, shallow: true]
                    ]
                ])
            }
        }
        
        stage('Pre-build Checks') {
            steps {
                script {
                    // Verify Dockerfile exists
                    if (!fileExists('Dockerfile')) {
                        error('Dockerfile not found in repository root')
                    }
                    
                    // Check Docker daemon
                    sh 'docker --version'
                    sh 'docker info'
                    
                    echo "Current user: \$(whoami)"
                    echo "Workspace: ${WORKSPACE}"
                    echo "Build number: ${BUILD_NUMBER}"
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    try {
                        echo "Building Docker image ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}..."
                        
                        // Build with proper error handling and no-cache for clean builds
                        sh """
                            docker build \
                                --no-cache \
                                --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                                --build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
                                -t "${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}" \
                                -t "${DOCKER_IMAGE_NAME}:latest" \
                                .
                        """
                        
                        // Verify image was created
                        sh "docker images ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
                        
                    } catch (Exception e) {
                        error("Docker build failed: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('Test Docker Image') {
            steps {
                script {
                    echo "Testing Docker image..."
                    
                    // Basic container test - adjust based on your app
                    sh """
                        # Test if container starts and stops properly
                        CONTAINER_ID=\$(docker run -d --name test-${BUILD_NUMBER} ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG})
                        sleep 5
                        
                        # Check if container is running
                        if [ \$(docker ps -q -f name=test-${BUILD_NUMBER} | wc -l) -eq 0 ]; then
                            echo "Container failed to start"
                            docker logs test-${BUILD_NUMBER}
                            exit 1
                        fi
                        
                        # Cleanup test container
                        docker stop test-${BUILD_NUMBER} || true
                        docker rm test-${BUILD_NUMBER} || true
                    """
                }
            }
        }
        
        stage('Save Docker Image Artifact') {
            steps {
                script {
                    echo "Saving Docker image to tar file..."
                    
                    // Create artifacts directory if it doesn't exist
                    sh 'mkdir -p artifacts'
                    
                    sh """
                        docker save -o "artifacts/${DOCKER_IMAGE_NAME}-${DOCKER_IMAGE_TAG}.tar" "${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
                        
                        # Verify tar file was created and get size
                        ls -lh artifacts/${DOCKER_IMAGE_NAME}-${DOCKER_IMAGE_TAG}.tar
                    """
                }
                
                archiveArtifacts artifacts: 'artifacts/*.tar', fingerprint: true, allowEmptyArchive: false
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    echo "Running security scan on Docker image..."
                    
                    // Example using Trivy (install trivy on Jenkins agent first)
                    // Uncomment and modify based on your security tools
                    /*
                    sh """
                        trivy image --exit-code 1 --severity HIGH,CRITICAL ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} || {
                            echo "Security vulnerabilities found!"
                            exit 1
                        }
                    """
                    */
                    
                    echo "Security scan completed (placeholder - configure your preferred scanner)"
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo 'Cleaning up...'
                
                // Clean up Docker images to save space
                sh """
                    # Remove test containers if any exist
                    docker ps -a --filter "name=test-${BUILD_NUMBER}" -q | xargs -r docker rm -f
                    
                    # Keep latest and current build, remove others for this app
                    docker images ${DOCKER_IMAGE_NAME} --format "table {{.Tag}}" | grep -v -E "(latest|${DOCKER_IMAGE_TAG}|TAG)" | head -5 | xargs -r -I {} docker rmi ${DOCKER_IMAGE_NAME}:{} || true
                    
                    # Clean up dangling images
                    docker image prune -f || true
                """
                
                echo 'Pipeline finished.'
            }
        }
        
        success {
            script {
                def imageSize = sh(
                    script: "docker images ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} --format 'table {{.Size}}' | tail -1",
                    returnStdout: true
                ).trim()
                
                emailext(
                    to: 'amitbatito@gmail.com',
                    subject: "✅ SUCCESS: Jenkins Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}",
                    body: """
                        <h3>Build Successful! 🎉</h3>
                        <ul>
                            <li><strong>Project:</strong> ${JOB_NAME}</li>
                            <li><strong>Build Number:</strong> ${BUILD_NUMBER}</li>
                            <li><strong>Docker Image:</strong> ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}</li>
                            <li><strong>Image Size:</strong> ${imageSize}</li>
                            <li><strong>Duration:</strong> ${currentBuild.durationString}</li>
                            <li><strong>Artifact:</strong> ${DOCKER_IMAGE_NAME}-${DOCKER_IMAGE_TAG}.tar</li>
                        </ul>
                        <p><a href="${BUILD_URL}">View Build Details</a></p>
                        <p><a href="${BUILD_URL}artifact/">Download Artifacts</a></p>
                    """,
                    mimeType: 'text/html'
                )
            }
        }
        
        failure {
            emailext(
                to: 'amitbatito@gmail.com',
                subject: "❌ FAILURE: Jenkins Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}",
                body: """
                    <h3>Build Failed! ⚠️</h3>
                    <ul>
                        <li><strong>Project:</strong> ${JOB_NAME}</li>
                        <li><strong>Build Number:</strong> ${BUILD_NUMBER}</li>
                        <li><strong>Failed Stage:</strong> ${env.STAGE_NAME ?: 'Unknown'}</li>
                        <li><strong>Duration:</strong> ${currentBuild.durationString}</li>
                    </ul>
                    <p><strong>Please check the Jenkins console output:</strong></p>
                    <p><a href="${BUILD_URL}console">View Console Output</a></p>
                    <p><a href="${BUILD_URL}">View Build Details</a></p>
                """,
                mimeType: 'text/html'
            )
        }
        
        unstable {
            emailext(
                to: 'amitbatito@gmail.com',
                subject: "⚠️ UNSTABLE: Jenkins Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}",
                body: "Build #${BUILD_NUMBER} completed but is marked as unstable. Please review: ${BUILD_URL}"
            )
        }
    }
}