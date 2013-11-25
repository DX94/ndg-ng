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

import play.data.validation.Required;
import play.mvc.Before;
import play.mvc.Http.StatusCode;

import controllers.logic.SurveyJsonTransformer;
import controllers.exceptions.SurveySavingException;
import controllers.logic.AuthorizationUtils;
import controllers.logic.SurveyPersister;
import controllers.logic.SurveyXmlBuilder;
import controllers.util.Constants;

import models.NdgUser;
import models.QuestionType;
import models.Survey;
import models.TransactionLog;
import models.constants.TransactionlogConsts;
import models.utils.NdgQuery;
import models.utils.SurveyDuplicator;

import flexjson.JSONSerializer;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.math.BigInteger;
import java.security.SecureRandom;
import java.util.Date;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class SurveyManager extends NdgController {

    public static void questionType() {
        List<QuestionType> types = QuestionType.find("bySupported", 1).fetch();

        JSONSerializer typeSerializer = new JSONSerializer();
        typeSerializer.include("typeName", "id").exclude("*").rootName("types");
        renderJSON(typeSerializer.serialize(types));
    }

    public static void saveSurvey(String surveyData) {
        String username = session.get("ndgUser");
        NdgUser currentUser = NdgUser.find("byUserName", username).first();
        renderText(SurveyJsonTransformer.saveSurvey(surveyData, currentUser.userAdmin));
    }

    public static void getSurvey(long surveyId) {
        try {
            Survey survey = Survey.find("byId", surveyId).first();
            System.out.println(survey.ndgUser.userAdmin);
            if (AuthorizationUtils.getSessionUserAdmin(session.get("ndgUser")).equals(survey.ndgUser.userAdmin)) {
                renderJSON(SurveyJsonTransformer.getJsonSurvey(surveyId));
            }
            else {
                error(StatusCode.UNAUTHORIZED, "Unauthorized");
            }
        } catch (NullPointerException npe) {
                error (StatusCode.UNAUTHORIZED, "Unauthorized");
        }
    }

    public static void upload(@Required File filename, String uploadSurveyId) throws IOException, SurveySavingException {
        InputStreamReader is = null;
        String username = null;
        String result = "failure";
        if (!session.contains("ndgUser")) {
            response.status = StatusCode.UNAUTHORIZED;
        } else {
            try {
                username = session.get("ndgUser");
                is = new InputStreamReader(new FileInputStream(filename), "UTF-8");
                SurveyPersister persister = new SurveyPersister(is);
                persister.saveSurvey(uploadSurveyId, username);
                result = "success";

            } finally {
                if (is != null) {
                    is.close();
                }
            }
            renderText(result);
        }
    }

    public static void get(String id) {
        try {
            final Writer result = new StringWriter();
            final PrintWriter printWriter = new PrintWriter(result);

            SurveyXmlBuilder builder = new SurveyXmlBuilder();

            try {
                Survey survey = Survey.find("bySurveyId", id).first();

                if (AuthorizationUtils.getSessionUserAdmin(session.get("ndgUser")).equals(survey.ndgUser.userAdmin)) {
                    builder.printSurveyXml(id, printWriter);
                    InputStream inputStream = new ByteArrayInputStream(result.toString().getBytes("UTF-8"));
                    renderBinary(inputStream, "survey_" + id + ".xml");
                }
                else {
                    error(StatusCode.UNAUTHORIZED, "Unauthorized");
                }
            } catch (NullPointerException npe) {
                error (StatusCode.UNAUTHORIZED, "Unauthorized");
            }
        } catch (Exception ex) {
            Logger.getLogger(SurveyManager.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    public static void delete(String formID) {
        try {
            Survey deleted = Survey.find("bySurveyId", formID).first();
            if (AuthorizationUtils.getSessionUserAdmin(session.get("ndgUser")).equals(deleted.ndgUser.userAdmin)) {
                deleted.delete();
            }
            else {
                error(StatusCode.UNAUTHORIZED, "Unauthorized");
            }

        } catch (NullPointerException npe) {
            error(StatusCode.UNAUTHORIZED, "Unauthorized");
        }
    }

    public static void duplicate(String formID) {
        try {
            Survey origin = Survey.find("bySurveyId", formID).first();
            if (AuthorizationUtils.getSessionUserAdmin(session.get("ndgUser")).equals(origin.ndgUser.userAdmin)) {

                SecureRandom random = new SecureRandom();
                String newId = new BigInteger(40, random).toString(32);

                Survey copy = SurveyDuplicator.plainCopy(origin, newId);

                copy.save();
            }
            else {
                error(StatusCode.UNAUTHORIZED, "Unauthorized");
            }
        } catch (NullPointerException npe) {
            error(StatusCode.UNAUTHORIZED, "Unauthorized");
        }
    }

    @Before(unless={"questionType", "saveSurvey", "getSurvey", "upload", "get", "delete", "duplicate", "sendSurveys"})
    public static void addDemoSurveyToNewUser(NdgUser user, String formID) {
        Survey origin = Survey.find("bySurveyId", formID).first();

        SecureRandom random = new SecureRandom();
        String newId = new BigInteger(40, random).toString(32);

        Survey copy = SurveyDuplicator.addDemoSurveyToNewUser(origin, newId, user);

        copy.save();
    }

    public static void sendSurveys(String formID, String users[]) {
        try {
            for (int i = 0; i < users.length; i++) {
                Survey surveyTemp = NdgQuery.getSurveyById(formID);
                if (AuthorizationUtils.getSessionUserAdmin(session.get("ndgUser")).equals(surveyTemp.ndgUser.userAdmin)) {
                    surveyTemp.available = Constants.SURVEY_AVAILABLE;
                    surveyTemp.save();

                    TransactionLog transaction = new TransactionLog();
                    transaction.survey = surveyTemp;

                    transaction.transactionDate = new Date();
                    transaction.transactionType = TransactionlogConsts.TransactionType.TYPE_SEND_SURVEY;
                    transaction.transactionStatus = TransactionlogConsts.TransactionStatus.STATUS_AVAILABLE;
                    transaction.transmissionMode = TransactionlogConsts.TransactionMode.MODE_HTTP;

                    transaction.address = request.remoteAddress;
                    transaction.ndgUser = NdgQuery.getUsersbyId(Long.parseLong(users[i]));

                    transaction.save();
                } else {
                    error(StatusCode.UNAUTHORIZED, "Unauthorized");
                }
            }
        } catch (NullPointerException np3) {
            error(StatusCode.UNAUTHORIZED, "Unauthorized");
        }
   }
}
