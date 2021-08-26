pipeline {
    agent any
    options {
        checkoutToSubdirectory('poem-react')
    }
    environment {
        PROJECT_DIR="poem-react"
    }
    stages {
        stage ('Prepare containers') {
            steps {
                script
                {
                    try
                    {
                        echo 'Prepare containers...'
                        sh '''
                            cd $WORKSPACE/$PROJECT_DIR/testenv/
                            docker-compose up -d
                            while (( 1 ))
                            do
                                sleep 5
                                containers_running=$(docker ps -f name=poem-react-tests -f status=running -q)
                                if [ ! -z "$containers_running" ]
                                then
                                    docker exec -i poem-react-tests /home/jenkins/poem-install.sh
                                    exit $?
                                else
                                    echo "not running"
                                fi
                            done
                        '''
                    }
                    catch (Exception err)
                    {
                        echo 'Failed preparation of containers...'
                        echo err.toString()
                    }
                }

            }
        }
        stage ('Execute tests') {
            parallel {
                stage ('Execute backend tests') {
                    steps {
                        script
                        {
                            try
                            {
                                echo 'Executing backend tests...'
                                sh '''
                                    while (( 1 ))
                                    do
                                        sleep 5
                                        containers_running=$(docker ps -f name=poem-react-tests -f status=running -q)
                                        if [ ! -z "$containers_running" ]
                                        then
                                            echo "running"
                                            docker exec -i poem-react-tests /home/jenkins/execute-backend-tests.sh
                                            exit $?
                                        else
                                            echo "not running"
                                        fi
                                    done
                                '''
                            }
                            catch (Exception err)
                            {
                                echo 'Backend tests failed...'
                                echo err.toString()
                            }
                        }
                    }
                }
                stage ('Execute frontend tests') {
                    steps {
                        script
                        {
                            try
                            {
                                echo 'Executing frontend tests...'
                                sh '''
                                    while (( 1 ))
                                    do
                                        sleep 5
                                        containers_running=$(docker ps -f name=poem-react-tests -f status=running -q)
                                        if [ ! -z "$containers_running" ]
                                        then
                                            echo "running"
                                            docker exec -i poem-react-tests /home/jenkins/execute-frontend-tests.sh
                                            exit $?
                                        else
                                            echo "not running"
                                        fi
                                    done
                                '''
                            }
                            catch (Exception err)
                            {
                                echo 'Frontend tests failed...'
                                echo err.toString()
                            }
                        }
                    }
                }
            }
        }
        stage ('Generating reports') {
            steps {
                publishCoverage adapters: [coberturaAdapter(path: 'poem-react/coverage.xml')]
            }
        }
        stage ('Teardown containers') {
            steps {
                script {
                    sh '''
                      cd $WORKSPACE/$PROJECT_DIR/testenv/
                      docker-compose down
                    '''
                }
            }
            post {
                always {
                    cleanWs()
                }
            }
        }
    }
}
