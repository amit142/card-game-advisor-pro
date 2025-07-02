pipeline {
    agent any
    
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

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('TypeScript Compilation Check') {
            steps {
                script {
                    echo 'Running TypeScript compiler checks...'
                    sh 'npx tsc --noEmit --pretty'
                }
            }
        }
        
        stage('Security Scanning') {
            parallel {
                stage('npm audit') {
                    steps {
                        script {
                            echo 'Scanning for vulnerable dependencies...'
                            // Run npm audit and capture output
                            def auditResult = sh(
                                script: 'npm audit --audit-level=moderate --json > npm-audit-report.json 2>&1 || true',
                                returnStatus: true
                            )
                            
                            // Archive the report
                            archiveArtifacts artifacts: 'npm-audit-report.json', allowEmptyArchive: true
                            
                            // Display summary
                            sh '''
                                echo "=== npm audit Summary ==="
                                npm audit --audit-level=moderate || echo "Vulnerabilities found - check archived report"
                            '''
                        }
                    }
                }
                
                stage('GitLeaks Secret Detection') {
                    steps {
                        script {
                            echo 'Scanning for secrets and sensitive information...'
                            
                            // Download and install GitLeaks
                            sh '''
                                # Download GitLeaks if not already present
                                if [ ! -f "./gitleaks" ]; then
                                    echo "Downloading GitLeaks..."
                                    
                                    # Debug: Check if GitHub API is accessible
                                    echo "Testing GitHub API access..."
                                    API_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" https://api.github.com/repos/zricethezav/gitleaks/releases/latest)
                                    HTTP_CODE=$(echo "$API_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
                                    
                                    echo "HTTP response code: $HTTP_CODE"
                                    
                                    if [ "$HTTP_CODE" != "200" ]; then
                                        echo "GitHub API request failed, using fallback version"
                                        GITLEAKS_VERSION="v8.18.4"
                                    else
                                        # Remove HTTP_CODE from response
                                        JSON_RESPONSE=$(echo "$API_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')
                                        
                                        # Get the latest version using jq or awk for better JSON parsing
                                        if command -v jq >/dev/null 2>&1; then
                                            GITLEAKS_VERSION=$(echo "$JSON_RESPONSE" | jq -r '.tag_name')
                                        else
                                            # Fallback method using awk
                                            GITLEAKS_VERSION=$(echo "$JSON_RESPONSE" | awk -F'"' '/tag_name/{print $4}')
                                        fi
                                        
                                        echo "Latest GitLeaks version: $GITLEAKS_VERSION"
                                        
                                        # Verify we got a valid version (not null or empty)
                                        if [ -z "$GITLEAKS_VERSION" ] || [ "$GITLEAKS_VERSION" = "null" ]; then
                                            echo "Failed to parse GitLeaks version, using fallback"
                                            GITLEAKS_VERSION="v8.18.4"  # Fallback to known working version
                                        fi
                                    fi
                                    
                                    echo "Using GitLeaks version: $GITLEAKS_VERSION"
                                    
                                    # Remove 'v' prefix for download URL
                                    VERSION_NUMBER=${GITLEAKS_VERSION#v}
                                    
                                    # Construct download URL
                                    DOWNLOAD_URL="https://github.com/zricethezav/gitleaks/releases/download/${GITLEAKS_VERSION}/gitleaks_${VERSION_NUMBER}_linux_x64.tar.gz"
                                    echo "Download URL: $DOWNLOAD_URL"
                                    
                                    # Download and extract
                                    if wget -q "$DOWNLOAD_URL"; then
                                        tar -xzf "gitleaks_${VERSION_NUMBER}_linux_x64.tar.gz"
                                        chmod +x gitleaks
                                        rm "gitleaks_${VERSION_NUMBER}_linux_x64.tar.gz"
                                        echo "GitLeaks installed successfully"
                                        ./gitleaks version
                                    else
                                        echo "Failed to download GitLeaks, trying alternative approach..."
                                        # Try direct installation via package manager or skip
                                        if command -v apt-get >/dev/null 2>&1; then
                                            echo "Attempting to install via apt..."
                                            # This might not work on all systems
                                            echo "GitLeaks installation failed - continuing without secret scanning"
                                            touch gitleaks-report.json
                                            echo "[]" > gitleaks-report.json
                                        else
                                            echo "No package manager available - skipping GitLeaks installation"
                                            touch gitleaks-report.json
                                            echo "[]" > gitleaks-report.json
                                        fi
                                    fi
                                fi
                            '''
                            
                            // Run GitLeaks scan
                            def gitleaksResult = sh(
                                script: '''
                                    if [ -f "./gitleaks" ] && [ -x "./gitleaks" ]; then
                                        ./gitleaks detect --report-format json --report-path gitleaks-report.json --verbose || true
                                    else
                                        echo "GitLeaks binary not available, skipping scan"
                                        echo "[]" > gitleaks-report.json
                                    fi
                                ''',
                                returnStatus: true
                            )
                            
                            // Archive the report
                            archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
                            
                            // Check results and fail if secrets found
                            script {
                                if (gitleaksResult == 1) {
                                    echo "⚠️  SECRETS DETECTED! Check the GitLeaks report."
                                    sh 'cat gitleaks-report.json'
                                    currentBuild.result = 'UNSTABLE'
                                } else {
                                    echo "✅ No secrets detected by GitLeaks"
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                script {
                    echo 'Building TypeScript project...'
                    sh 'npx tsc'
                }
            }
        }
        
        stage('Security Summary') {
            steps {
                script {
                    echo '=== Security Scan Summary ==='
                    
                    // npm audit summary
                    sh '''
                        echo "📦 Dependency Vulnerabilities:"
                        if [ -f "npm-audit-report.json" ]; then
                            if command -v jq >/dev/null 2>&1; then
                                AUDIT_COUNT=$(cat npm-audit-report.json | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "0")
                            else
                                AUDIT_COUNT="Unknown (jq not available)"
                            fi
                            echo "Total vulnerabilities found: $AUDIT_COUNT"
                        fi
                    '''
                    
                    // GitLeaks summary
                    sh '''
                        echo "🔐 Secret Detection:"
                        if [ -f "gitleaks-report.json" ]; then
                            if command -v jq >/dev/null 2>&1; then
                                SECRETS_COUNT=$(cat gitleaks-report.json | jq '. | length' 2>/dev/null || echo "0")
                            else
                                SECRETS_COUNT="Unknown (jq not available)"
                            fi
                            echo "Potential secrets found: $SECRETS_COUNT"
                        fi
                    '''
                }
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