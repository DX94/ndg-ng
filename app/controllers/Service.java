/*
*  Nokia Data Gathering
*
*  Copyright (C) 2011 Nokia Corporation
*
*  This program is free software; you can redistribute it and/or
*  modify it under the terms of the GNU Lesser General Public
*  License as published by the Free Software Foundation; either
*  version 2.1 of the License, or (at your option) any later version.
*
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
*  Lesser General Public License for more details.
*
*  You should have received a copy of the GNU Lesser General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/
*/

package controllers;

import controllers.transformer.CSVTransformer;
import controllers.transformer.ExcelTransformer;
import flexjson.JSONSerializer;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Collection;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import models.Answer;
import models.Category;
import models.NdgResult;
import models.Question;
import models.Survey;
import models.constants.QuestionTypesConsts;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.logging.LogFactory;
import org.apache.commons.logging.Log;

import de.micromata.opengis.kml.v_2_2_0.Document;
import de.micromata.opengis.kml.v_2_2_0.Feature;
import de.micromata.opengis.kml.v_2_2_0.Folder;
import de.micromata.opengis.kml.v_2_2_0.Kml;
import de.micromata.opengis.kml.v_2_2_0.LatLonBox;
import de.micromata.opengis.kml.v_2_2_0.LookAt;
import de.micromata.opengis.kml.v_2_2_0.Placemark;

public class Service extends NdgController {

    private static final String CSV = ".csv";
    private static final String XLS = ".xls";
    private static final String ZIP = ".zip";
    private static final String SURVEY = "survey";
    private static Log log = LogFactory.getLog( Service.class );

    public static void allToKML( String surveyId ) {
        Survey survey = Survey.findById( Long.decode( surveyId ) );
        Collection<NdgResult> results = new ArrayList<NdgResult>();
        Collection<NdgResult> removalResults = new ArrayList<NdgResult>();
        results = survey.resultCollection;

        for (NdgResult current : results) {
            if(current.latitude == null || current.longitude == null) {
                removalResults.add(current);
            }
        }
        results.removeAll(removalResults);

        ByteArrayOutputStream arqExport = new ByteArrayOutputStream();
        String fileName = surveyId + ".kml";

        try {
            final Kml kml = new Kml();
            final Document document = kml.createAndSetDocument();

            for (NdgResult current : results) {
//                String description = "<![CDATA[ ";
                String description = "";
                int i = 0;

                List<Question> questions = new ArrayList<Question>();
                questions = survey.getQuestions();

                if(questions.isEmpty()) {
                    description += "<b> NO QUESTION </b> <br><br>";
                }

                for(Question question : questions) {
                    i++;
                    description += "<h3><b>" + i + " - " + question.label + "</b></h3><br>";

                    Collection<Answer> answers = CollectionUtils.intersection(question.answerCollection, current.answerCollection );
                    if ( answers.isEmpty() ) {
                        description += "<br><br>";
                    } else if ( answers.size() == 1 ) {
                        Answer answer = answers.iterator().next();

                        if ( answer.question.questionType.typeName.equalsIgnoreCase( QuestionTypesConsts.IMAGE ) ) {
/*                            ByteArrayOutputStream baos = new ByteArrayOutputStream(); //TODO Include image, right
                            byte[] buf = new byte[1024];                                //now it adds base64 to the img
                            InputStream in = answer.binaryData.get();                   //tag but it doesn't show on
                            int n = 0;                                                  //the map
                            try {
                                while( (n = in.read(buf) ) >= 0) {
                                    baos.write(buf, 0, n);
                                }
                                in.close();
                            } catch(IOException ex) {
                                System.out.println("IO");
                            }

                            byte[] bytes = baos.toByteArray();
                            System.out.println("image = " + Base64.encodeBase64String(bytes));
                            description += "<img src='data:image/jpeg;base64," + Base64.encodeBase64String(bytes)
                                        + "'/> <br><br>"; */
                            description += "<b> #image</b> <br><br>";
                        } else {
                            description += "<h4 style='color:#3a77ca'><b>" + answer.textData + "</b></h4><br>";
                        }
                    }
                }
//                description += " ]]>";

                document.createAndAddPlacemark()
                    .withName(current.title).withOpen(Boolean.TRUE)
                    .withDescription(description)
                    .createAndSetPoint().addToCoordinates(current.longitude + ", " + current.latitude);
            }

            kml.marshal(arqExport);
            send(fileName, arqExport.toByteArray());
        } catch (FileNotFoundException ex) {
        }
    }

    public static void selectedToKML( String surveyId, String resultIDs ) {
        Survey survey = Survey.findById( Long.decode( surveyId ) );
        String[] resultsIds = resultIDs.split( "," );

        Collection<NdgResult> results = new ArrayList<NdgResult>();
        Collection<NdgResult> removalResults = new ArrayList<NdgResult>();
        NdgResult result = null;

        if ( resultsIds.length > 0 ) {
            for ( int i = 0; i < resultsIds.length; i++ ) {
                result = NdgResult.find( "byId", Long.parseLong(resultsIds[i]) ).first();
                if ( result != null ) {
                    results.add( result );
                }
            }
        }

        for (NdgResult current : results) {
            if(current.latitude == null || current.longitude == null) {
                removalResults.add(current);
            }
        }
        results.removeAll(removalResults);

        ByteArrayOutputStream arqExport = new ByteArrayOutputStream();
        String fileName = surveyId + ".kml";

        try {
            final Kml kml = new Kml();
            final Document document = kml.createAndSetDocument();

            for (NdgResult current : results) {
//                String description = "<![CDATA[ ";
                String description = "";
                int i = 0;

                List<Question> questions = new ArrayList<Question>();
                questions = survey.getQuestions();

                if(questions.isEmpty()) {
                    description += "<b> NO QUESTION </b> <br><br>";
                }

                for(Question question : questions) {
                    i++;
                    description += "<h3><b>" + i + " - " + question.label + "</b></h3><br>";

                    Collection<Answer> answers = CollectionUtils.intersection(question.answerCollection, current.answerCollection );
                    if ( answers.isEmpty() ) {
                        description += "<br><br>";
                    } else if ( answers.size() == 1 ) {
                        Answer answer = answers.iterator().next();

                        if ( answer.question.questionType.typeName.equalsIgnoreCase( QuestionTypesConsts.IMAGE ) ) {
/*                            ByteArrayOutputStream baos = new ByteArrayOutputStream();
                            byte[] buf = new byte[1024];
                            InputStream in = answer.binaryData.get();
                            int n = 0;
                            try {
                                while( (n = in.read(buf) ) >= 0) {                                                            
                                    baos.write(buf, 0, n);
                                }
                                in.close();
                            } catch(IOException ex) {
                                System.out.println("IO");
                            }

                            byte[] bytes = baos.toByteArray();
                            System.out.println("image = " + Base64.encodeBase64String(bytes));
                            description += "<img src='data:image/jpeg;base64," + Base64.encodeBase64String(bytes)
                                        + "'/> <br><br>"; */
                            description += "<b> #image</b> <br><br>";
                        } else {
                            description += "<h4 style='color:#3a77ca'><b>" + answer.textData + "</b></h4><br>";
                        }
                    }
                }
//                description += " ]]>";

                document.createAndAddPlacemark()
                    .withName(current.title).withOpen(Boolean.TRUE)
                    .withDescription(description)
                    .createAndSetPoint().addToCoordinates(current.longitude + ", " + current.latitude);
            }

            kml.marshal(arqExport);
            send(fileName, arqExport.toByteArray());
        } catch (FileNotFoundException ex) {
        }
    }

    public static void getAllResults( String surveyId ) {
        Survey survey = Survey.findById( Long.decode( surveyId ) );
        Collection<NdgResult> results = new ArrayList<NdgResult>();
        Collection<NdgResult> removalResults = new ArrayList<NdgResult>();
        results = survey.resultCollection;

        for (NdgResult current : results) {
            if(current.latitude == null || current.longitude == null) {
                removalResults.add(current);
            }
        }
        results.removeAll(removalResults);

        JSONSerializer surveyListSerializer = new JSONSerializer();
        surveyListSerializer.include("id", "resultId", "title", "startTime", "endTime", "ndgUser", "latitude", "longitude")
                                    .exclude("*").rootName("items");

        renderJSON( surveyListSerializer.serialize(results) );
    }

    public static void getResults( String surveyId, String resultIDs ) {
        String[] resultsIds = resultIDs.split( "," );

        Collection<NdgResult> results = new ArrayList<NdgResult>();
        Collection<NdgResult> removalResults = new ArrayList<NdgResult>();
        NdgResult result = null;

        if ( resultsIds.length > 0 ) {
            for ( int i = 0; i < resultsIds.length; i++ ) {
                result = NdgResult.find( "byId", Long.parseLong(resultsIds[i]) ).first();
                if ( result != null ) {
                    results.add( result );
                }
            }
        }

        for (NdgResult current : results) {
            if(current.latitude == null || current.longitude == null) {
                removalResults.add(current);
            }
        }
        results.removeAll(removalResults);

        JSONSerializer surveyListSerializer = new JSONSerializer();
        surveyListSerializer.include("id", "resultId", "title", "startTime", "endTime", "ndgUser", "latitude", "longitude")
                                    .exclude("*").rootName("items");

        renderJSON( surveyListSerializer.serialize(results) );
    }

    public static void surveyHasImages( String surveyId ) {
        Survey survey = Survey.findById( Long.decode( surveyId ) );

        boolean hasImages = false;

        for (Category category : survey.categoryCollection){
            for ( Question question :category.questionCollection ) {
                if ( question.questionType.typeName.equals( QuestionTypesConsts.IMAGE ) ) {
                    hasImages = true;
                    break;
                }
            }
        }

        JSONSerializer surveyListSerializer = new JSONSerializer();
        surveyListSerializer.include( "*" ).rootName( "hasImages" );
        renderJSON( surveyListSerializer.serialize( hasImages ) );
    }

    public static void prepareselected( String ids, String fileFormat, Boolean exportWithImages ) {
        String fileType = "";
        byte[] fileContent = null;

        String[] resultsIds = ids.split( "," );

        Collection<NdgResult> results = new ArrayList<NdgResult>();
        NdgResult result = null;

        if ( resultsIds.length > 0 ) {
            for ( int i = 0; i < resultsIds.length; i++ ) {
                result = NdgResult.find( "byId", Long.parseLong(resultsIds[i]) ).first();
                if ( result != null ) {
                    results.add( result );
                }
            }
        }

        if ( exportWithImages == true ) {
            new File( result.survey.surveyId ).mkdir();
            new File( result.survey.surveyId + File.separator + "photos" ).mkdir();
        }

        if ( CSV.equalsIgnoreCase( fileFormat ) ) {
            CSVTransformer transformer = new CSVTransformer( result.survey, results, exportWithImages );
            fileContent = transformer.getBytes();
            fileType = CSV;
        } else if ( XLS.equalsIgnoreCase( fileFormat ) ) {
            ExcelTransformer transformer = new ExcelTransformer( result.survey, results, exportWithImages );
            fileContent = transformer.getBytes();
            fileType = XLS;
        }

        if ( exportWithImages == true ) {
            zipSurvey( result.survey.surveyId, fileContent, fileType );
            File zipFile = new File( SURVEY + result.survey.surveyId + ZIP );
            File zipDir = new File( result.survey.surveyId );
            try {
                fileContent = getBytesFromFile( zipFile );
            } catch ( IOException e ) {
                e.printStackTrace();
            }

            fileType = ZIP;
            zipFile.delete();
            deleteDir( zipDir );
        }

        String fileName = SURVEY + result.survey.surveyId + fileType;
        send( fileName, fileContent );
    }

    public static void prepare( String surveyId, String fileFormat, Boolean exportWithImages ) {
        String fileType = "";
        byte[] fileContent = null;

        Survey survey = Survey.findById( Long.decode( surveyId ) );

        if ( exportWithImages == true ) {
            new File( survey.surveyId ).mkdir();
            new File( survey.surveyId + File.separator + "photos" ).mkdir();
        }

        if ( CSV.equalsIgnoreCase( fileFormat ) ) {
            CSVTransformer transformer = new CSVTransformer( survey, exportWithImages );
            fileContent = transformer.getBytes();//this is export all functionality
            fileType = CSV;
        } else if ( XLS.equalsIgnoreCase( fileFormat ) ) {
            ExcelTransformer transformer = new ExcelTransformer( survey, exportWithImages );
            fileContent = transformer.getBytes();//this is export all functionality
            fileType = XLS;
        }

        if ( exportWithImages == true ) {
            zipSurvey( survey.surveyId, fileContent, fileType );
            File zipFile = new File( SURVEY + survey.surveyId + ZIP );
            File zipDir = new File( survey.surveyId );
            try {
                fileContent = getBytesFromFile( zipFile );
            } catch ( IOException e ) {
                e.printStackTrace();
            }

            fileType = ZIP;
            zipFile.delete();
            deleteDir( zipDir );
        }

        String fileName = SURVEY + survey.surveyId + fileType;
        send( fileName, fileContent );
    }

    private static byte[] getBytesFromFile( File file ) throws IOException {
        InputStream is = new FileInputStream( file );

        long length = file.length();

        byte[] bytes = new byte[(int) length];

        int offset = 0;
        int numRead = 0;

        while ( offset < bytes.length && (numRead = is.read( bytes, offset, bytes.length - offset )) >= 0 ) {
            offset += numRead;
        }

        if ( offset < bytes.length ) {
            throw new IOException( "Could not completely read file " + file.getName() );
        }

        is.close();

        return bytes;
    }

    private static void zipSurvey( String surveyId, byte[] fileContent, String fileType ) {
        FileOutputStream arqExport;
        try {
            if ( fileType.equals( XLS ) ) {
                arqExport = new FileOutputStream( surveyId + File.separator + SURVEY + surveyId + XLS );
                arqExport.write( fileContent );
                arqExport.close();
            } else if ( fileType.equals( CSV ) ) {
                arqExport = new FileOutputStream( surveyId + File.separator + SURVEY + surveyId + CSV );
                arqExport.write( fileContent );
                arqExport.close();
            }

            ZipOutputStream zos = new ZipOutputStream( new FileOutputStream( SURVEY + surveyId + ZIP ) );

            zipDir( surveyId, zos );

            zos.close();
        } catch ( Exception e ) {
            e.printStackTrace();
        }
    }

    private static void zipDir( String dir2zip, ZipOutputStream zos ) {
        try {

            File zipDir = new File( dir2zip );

            String[] dirList = zipDir.list();
            byte[] readBuffer = new byte[2156];
            int bytesIn = 0;

            for ( int i = 0; i < dirList.length; i++ ) {
                File f = new File( zipDir, dirList[i] );
                if ( f.isDirectory() ) {
                    String filePath = f.getPath();
                    zipDir( filePath, zos );
                    continue;
                }

                FileInputStream fis = new FileInputStream( f );

                ZipEntry anEntry = new ZipEntry( f.getPath() );

                zos.putNextEntry( anEntry );

                while ( (bytesIn = fis.read( readBuffer )) != -1 ) {
                    zos.write( readBuffer, 0, bytesIn );
                }

                fis.close();
            }
        } catch ( Exception e ) {
            e.printStackTrace();
        }
    }

    private static boolean deleteDir( File dir ) {
        if ( dir.isDirectory() ) {
            String[] children = dir.list();
            for ( int i = 0; i < children.length; i++ ) {
                boolean success = deleteDir( new File( dir, children[i] ) );

                if ( !success ) {
                    return false;
                }
            }
        }
        return dir.delete();
    }

    private static void send( String fileName, byte[] fileContent ) {
        InputStream in = null;
        try {
            in = new ByteArrayInputStream( fileContent );
            renderBinary( in, fileName );
        } finally {
            if ( in != null ) {
                try {
                    in.close();
                } catch ( IOException ex ) {
                }
            }
        }
    }
}
